

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_project_from_shapefile(request):
    """
    Create a new project from Shapefile(s) - atomic operation

    This endpoint handles the complete workflow:
    1. Create project database and records
    2. Import all Shapefiles to PostGIS
    3. Generate QGS file with all layers
    4. Generate tree.json with layer hierarchy
    """
    import tempfile
    import shutil
    from django.db import transaction
    from qgis.core import QgsProject, QgsVectorLayer, QgsCoordinateReferenceSystem, QgsVectorFileWriter
    from .serializers import CreateProjectFromShapefileSerializer
    from .utils import generate_project_name
    from ..dao import create_geo_json_layer
    from ..models import ProjectItem, Domain, QgsFile, Layer
    from .service import make_json_tree_and_save

    # Validate basic project data
    serializer = CreateProjectFromShapefileSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Błąd walidacji danych',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    user = request.user

    # Parse Shapefile sets from request.FILES
    shapefile_sets = []
    index = 0
    while True:
        # Check if shapefiles[N].shp exists
        shp_key = f'shapefiles[{index}].shp'
        if shp_key not in request.FILES:
            break

        # Extract all files for this Shapefile
        shapefile_set = {
            'name': request.data.get(f'shapefiles[{index}].name', f'layer_{index}'),
            'shp': request.FILES.get(f'shapefiles[{index}].shp'),
            'shx': request.FILES.get(f'shapefiles[{index}].shx'),
            'dbf': request.FILES.get(f'shapefiles[{index}].dbf'),
            'prj': request.FILES.get(f'shapefiles[{index}].prj'),
            'cpg': request.FILES.get(f'shapefiles[{index}].cpg'),
            'qpj': request.FILES.get(f'shapefiles[{index}].qpj'),
        }
        shapefile_sets.append(shapefile_set)
        index += 1

    if not shapefile_sets:
        return Response({
            'success': False,
            'message': 'Nie wybrano plików Shapefile do importu'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Generate unique project name
    custom_project_name = validated_data['project']
    project_name = generate_project_name(custom_project_name)

    try:
        with transaction.atomic():
            # 1. Create project using existing service function
            from .service import create_project as create_project_func

            create_data = {
                'project': custom_project_name,
                'domain': validated_data['domain'],
                'projectDescription': validated_data.get('projectDescription', ''),
                'keywords': validated_data.get('keywords', ''),
                'categories': validated_data.get('categories', 'Inne'),
            }

            # Call existing create_project function
            result = create_project_func(user, create_data)

            if result.status_code != 200:
                result_data = json.loads(result.content.decode('utf-8'))
                return Response(result_data, status=result.status_code)

            result_data = json.loads(result.content.decode('utf-8'))
            actual_project_name = result_data['data']['db_name']

            # Get project item
            project_item = ProjectItem.objects.get(project_name=actual_project_name)

            # 2. Initialize QGIS project
            qgs_project = QgsProject.instance()
            qgs_project.clear()

            # Set project CRS (default: EPSG:3857)
            crs = QgsCoordinateReferenceSystem("EPSG:3857")
            qgs_project.setCrs(crs)

            # 3. Import each Shapefile to PostGIS and add to QGS
            imported_layers = []

            for idx, shp_set in enumerate(shapefile_sets):
                # Create temporary directory for Shapefile components
                temp_dir = tempfile.mkdtemp()

                try:
                    # Save Shapefile components to temp directory
                    base_name = shp_set['name'].replace(' ', '_').replace('-', '_')
                    shp_path = os.path.join(temp_dir, f"{base_name}.shp")

                    # Save .shp file (required)
                    with open(shp_path, 'wb') as f:
                        for chunk in shp_set['shp'].chunks():
                            f.write(chunk)

                    # Save optional files
                    for ext in ['shx', 'dbf', 'prj', 'cpg', 'qpj']:
                        if shp_set.get(ext):
                            file_path = os.path.join(temp_dir, f"{base_name}.{ext}")
                            with open(file_path, 'wb') as f:
                                for chunk in shp_set[ext].chunks():
                                    f.write(chunk)

                    # Load Shapefile with QGIS
                    vector_layer = QgsVectorLayer(shp_path, base_name, "ogr")
                    if not vector_layer.isValid():
                        raise Exception(f"Nieprawidłowy plik Shapefile: {base_name}")

                    # Export to GeoJSON
                    geojson_path = os.path.join(temp_dir, f"{base_name}.geojson")
                    error = QgsVectorFileWriter.writeAsVectorFormat(
                        vector_layer,
                        geojson_path,
                        "UTF-8",
                        crs,
                        "GeoJSON"
                    )
                    if error[0] != QgsVectorFileWriter.NoError:
                        raise Exception(f"Błąd eksportu GeoJSON: {error[1]}")

                    # Import GeoJSON to PostGIS
                    source_table_name = f"{actual_project_name}_{base_name}".replace('-', '_')
                    epsg = "3857"  # Default

                    create_geo_json_layer(
                        data={'project_name': actual_project_name},
                        user=user,
                        path_gml=geojson_path,
                        source_table_name=source_table_name,
                        source_epsg=epsg
                    )

                    # Create Layer record in database
                    Layer.objects.create(
                        project=actual_project_name,
                        projectitem=project_item,
                        source_table_name=source_table_name,
                        published=False,
                        public=False,
                        is_app=True
                    )

                    # Add layer to QGIS project
                    uri = f"dbname='{actual_project_name}' host='localhost' port='5432' user='{settings.DATABASES['default']['USER']}' password='{settings.DATABASES['default']['PASSWORD']}' table='{source_table_name}' (geom)"

                    qgs_layer = QgsVectorLayer(uri, shp_set['name'], "postgres")
                    if qgs_layer.isValid():
                        qgs_project.addMapLayer(qgs_layer)

                    # Get layer info
                    extent = vector_layer.extent()

                    imported_layers.append({
                        'layer_name': shp_set['name'],
                        'source_table_name': source_table_name,
                        'geometry_type': str(vector_layer.geometryType()),
                        'feature_count': vector_layer.featureCount(),
                        'extent': [
                            extent.xMinimum(),
                            extent.yMinimum(),
                            extent.xMaximum(),
                            extent.yMaximum()
                        ]
                    })

                finally:
                    # Clean up temp directory
                    shutil.rmtree(temp_dir, ignore_errors=True)

            # 4. Save QGS project file
            project_dir = os.path.join(settings.BASE_DIR, 'qgs', actual_project_name)
            os.makedirs(project_dir, exist_ok=True)

            qgs_file_path = os.path.join(project_dir, f"{actual_project_name}.qgs")
            qgs_project.write(qgs_file_path)

            # 5. Update QgsFile record (should already exist from create_project)
            QgsFile.objects.update_or_create(
                project=actual_project_name,
                defaults={'qgs': qgs_file_path}
            )

            # 6. Generate tree.json
            tree_json_path = os.path.join(project_dir, 'tree.json')
            make_json_tree_and_save(qgs_project, actual_project_name)

            # 7. Prepare response
            return Response({
                'success': True,
                'message': f"Projekt '{actual_project_name}' został utworzony z {len(imported_layers)} warstwami",
                'data': {
                    'project_name': actual_project_name,
                    'db_name': actual_project_name,
                    'domain': validated_data['domain'],
                    'layers': imported_layers,
                    'qgs_path': qgs_file_path,
                    'tree_json_path': tree_json_path
                }
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating project from shapefile: {str(e)}")
        # Rollback will happen automatically due to transaction.atomic()
        return Response({
            'success': False,
            'message': f'Błąd podczas tworzenia projektu: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
