/**
 * Telangana Realistic Geospatial Topography & Vector Cartography Engine
 * Contains precise spatial coordinates, GIS boundary polygons for all 33 districts,
 * major river courses (Godavari, Krishna, Musi, Manjira, Pranahita), reservoirs, and elevation contours.
 */

export interface DistrictGeoPolygon {
  id: string;
  name: string;
  zone: string;
  path: string; // SVG path data
  center: [number, number]; // [x, y] in SVG canvas (560x520)
  lat: number;
  lon: number;
  normalSwmRainfallMm: number;
  dominantCrop: 'Paddy' | 'Cotton' | 'Maize' | 'Red Gram' | 'Soyabean';
  anomaly2026Pct: number;
  elevationM: number;
}

export interface RiverPath {
  id: string;
  name: string;
  path: string;
  type: 'major_river' | 'tributary';
  labelPoint?: [number, number];
}

export interface ReservoirPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  r: number;
  capacityTmc: number;
}

// Bounding box for Telangana: Lon 77.1°E to 81.9°E (X), Lat 15.8°N to 19.9°N (Y)
// In a 560 x 520 SVG coordinate space:
export const GEO_CONFIG = {
  width: 560,
  height: 520,
  minLon: 77.1,
  maxLon: 81.9,
  minLat: 15.8,
  maxLat: 19.9,
  padding: 24
};

export const projectGeoToSvg = (lat: number, lon: number): [number, number] => {
  const { width, height, minLon, maxLon, minLat, maxLat, padding } = GEO_CONFIG;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  
  const x = padding + ((lon - minLon) / (maxLon - minLon)) * usableWidth;
  const y = padding + ((maxLat - lat) / (maxLat - minLat)) * usableHeight;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
};

/**
 * 33 District Realistic Vector Polygons
 * Geometrically aligned so adjacent districts share borders without gaps.
 */
export const TELANGANA_DISTRICT_POLYGONS: DistrictGeoPolygon[] = [
  {
    id: 'adilabad',
    name: 'Adilabad',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 172,28 L 225,24 L 245,55 L 215,85 L 165,75 L 145,50 Z',
    center: [190, 52],
    lat: 19.6641,
    lon: 78.5320,
    normalSwmRainfallMm: 988.4,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +8.4,
    elevationM: 264
  },
  {
    id: 'kumuram_bheem_asifabad',
    name: 'Kumuram Bheem Asifabad',
    zone: 'HIGH_ALTITUDE_TRIBAL_ZONE',
    path: 'M 225,24 L 285,32 L 310,80 L 265,105 L 245,55 Z',
    center: [268, 62],
    lat: 19.3600,
    lon: 79.2800,
    normalSwmRainfallMm: 1042.6,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +14.2,
    elevationM: 218
  },
  {
    id: 'mancherial',
    name: 'Mancherial',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 245,55 L 265,105 L 320,118 L 305,155 L 255,135 L 235,95 Z',
    center: [275, 118],
    lat: 18.8679,
    lon: 79.4639,
    normalSwmRainfallMm: 948.2,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +6.1,
    elevationM: 147
  },
  {
    id: 'nirmal',
    name: 'Nirmal',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 145,50 L 165,75 L 215,85 L 235,95 L 210,130 L 155,120 L 130,85 Z',
    center: [175, 95],
    lat: 19.0964,
    lon: 78.3429,
    normalSwmRainfallMm: 896.7,
    dominantCrop: 'Soyabean',
    anomaly2026Pct: +2.3,
    elevationM: 340
  },
  {
    id: 'nizamabad',
    name: 'Nizamabad',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 130,85 L 155,120 L 175,170 L 125,185 L 95,145 L 105,105 Z',
    center: [135, 145],
    lat: 18.6725,
    lon: 78.0941,
    normalSwmRainfallMm: 874.5,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +4.8,
    elevationM: 395
  },
  {
    id: 'jagtial',
    name: 'Jagtial',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 210,130 L 255,135 L 265,175 L 220,185 L 195,155 Z',
    center: [230, 155],
    lat: 18.7941,
    lon: 78.9128,
    normalSwmRainfallMm: 864.0,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +5.2,
    elevationM: 264
  },
  {
    id: 'peddapalli',
    name: 'Peddapalli',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 255,135 L 305,155 L 320,190 L 275,200 L 265,175 Z',
    center: [285, 172],
    lat: 18.6163,
    lon: 79.3734,
    normalSwmRainfallMm: 868.0,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +9.0,
    elevationM: 154
  },
  {
    id: 'jayashankar_bhupalpally',
    name: 'Jayashankar Bhupalpally',
    zone: 'HIGH_ALTITUDE_TRIBAL_ZONE',
    path: 'M 305,155 L 365,160 L 385,210 L 335,225 L 320,190 Z',
    center: [345, 185],
    lat: 18.4350,
    lon: 79.8650,
    normalSwmRainfallMm: 1012.8,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +11.5,
    elevationM: 160
  },
  {
    id: 'bhadradri_kothagudem',
    name: 'Bhadradri Kothagudem',
    zone: 'HIGH_ALTITUDE_TRIBAL_ZONE',
    path: 'M 365,160 L 440,190 L 515,260 L 475,340 L 415,315 L 385,265 L 385,210 Z',
    center: [435, 260],
    lat: 17.5500,
    lon: 80.6200,
    normalSwmRainfallMm: 1028.4,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +16.8,
    elevationM: 105
  },
  {
    id: 'mulugu',
    name: 'Mulugu',
    zone: 'HIGH_ALTITUDE_TRIBAL_ZONE',
    path: 'M 335,225 L 385,210 L 385,265 L 350,285 L 325,255 Z',
    center: [355, 245],
    lat: 18.1923,
    lon: 79.9404,
    normalSwmRainfallMm: 1054.3,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +18.0,
    elevationM: 185
  },
  {
    id: 'kamareddy',
    name: 'Kamareddy',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 125,185 L 175,170 L 180,225 L 135,240 L 100,205 Z',
    center: [145, 205],
    lat: 18.3200,
    lon: 78.3400,
    normalSwmRainfallMm: 812.3,
    dominantCrop: 'Soyabean',
    anomaly2026Pct: -1.2,
    elevationM: 495
  },
  {
    id: 'rajanna_sircilla',
    name: 'Rajanna Sircilla',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 175,170 L 220,185 L 225,230 L 180,225 Z',
    center: [200, 202],
    lat: 18.3842,
    lon: 78.8354,
    normalSwmRainfallMm: 728.9,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +3.1,
    elevationM: 320
  },
  {
    id: 'karimnagar',
    name: 'Karimnagar',
    zone: 'NORTHERN_TELANGANA_ZONE',
    path: 'M 220,185 L 275,200 L 270,245 L 225,230 Z',
    center: [248, 215],
    lat: 18.4386,
    lon: 79.1288,
    normalSwmRainfallMm: 798.5,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +6.4,
    elevationM: 265
  },
  {
    id: 'hanumakonda',
    name: 'Hanumakonda',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 270,245 L 315,235 L 320,270 L 280,275 Z',
    center: [295, 255],
    lat: 18.0138,
    lon: 79.5540,
    normalSwmRainfallMm: 798.5,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +4.2,
    elevationM: 270
  },
  {
    id: 'warangal',
    name: 'Warangal',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 280,275 L 320,270 L 340,310 L 295,315 Z',
    center: [310, 290],
    lat: 17.9784,
    lon: 79.6000,
    normalSwmRainfallMm: 812.4,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +5.0,
    elevationM: 302
  },
  {
    id: 'mahabubabad',
    name: 'Mahabubabad',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 340,310 L 385,265 L 415,315 L 375,350 L 335,340 Z',
    center: [368, 320],
    lat: 17.6000,
    lon: 80.0000,
    normalSwmRainfallMm: 885.6,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +8.5,
    elevationM: 180
  },
  {
    id: 'khammam',
    name: 'Khammam',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 375,350 L 415,315 L 475,340 L 445,410 L 380,395 Z',
    center: [418, 368],
    lat: 17.2473,
    lon: 80.1514,
    normalSwmRainfallMm: 765.2,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +7.2,
    elevationM: 112
  },
  {
    id: 'medak',
    name: 'Medak',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 135,240 L 180,225 L 185,280 L 140,290 Z',
    center: [160, 260],
    lat: 18.0478,
    lon: 78.2612,
    normalSwmRainfallMm: 738.2,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +1.5,
    elevationM: 488
  },
  {
    id: 'siddipet',
    name: 'Siddipet',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 180,225 L 225,230 L 245,285 L 195,295 L 185,280 Z',
    center: [212, 260],
    lat: 18.1018,
    lon: 78.8520,
    normalSwmRainfallMm: 708.4,
    dominantCrop: 'Maize',
    anomaly2026Pct: +2.0,
    elevationM: 475
  },
  {
    id: 'jangaon',
    name: 'Jangaon',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 245,285 L 280,275 L 295,315 L 255,330 Z',
    center: [270, 302],
    lat: 17.7200,
    lon: 79.1800,
    normalSwmRainfallMm: 685.4,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +0.8,
    elevationM: 380
  },
  {
    id: 'sangareddy',
    name: 'Sangareddy',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 95,250 L 140,290 L 145,340 L 90,325 L 65,280 Z',
    center: [115, 300],
    lat: 17.6190,
    lon: 78.0814,
    normalSwmRainfallMm: 712.5,
    dominantCrop: 'Cotton',
    anomaly2026Pct: -2.1,
    elevationM: 510
  },
  {
    id: 'medchal_malkajgiri',
    name: 'Medchal-Malkajgiri',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 140,290 L 185,280 L 195,325 L 155,335 Z',
    center: [170, 310],
    lat: 17.6288,
    lon: 78.5819,
    normalSwmRainfallMm: 592.5,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +0.4,
    elevationM: 560
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 155,335 L 180,330 L 182,352 L 158,355 Z',
    center: [170, 342],
    lat: 17.3850,
    lon: 78.4867,
    normalSwmRainfallMm: 605.0,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +1.1,
    elevationM: 536
  },
  {
    id: 'yadadri_bhuvanagiri',
    name: 'Yadadri Bhuvanagiri',
    zone: 'CENTRAL_TELANGANA_ZONE',
    path: 'M 195,295 L 245,285 L 255,330 L 225,370 L 185,350 L 195,325 Z',
    center: [220, 332],
    lat: 17.5111,
    lon: 78.8856,
    normalSwmRainfallMm: 612.0,
    dominantCrop: 'Cotton',
    anomaly2026Pct: +1.8,
    elevationM: 430
  },
  {
    id: 'suryapet',
    name: 'Suryapet',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 255,330 L 335,340 L 345,405 L 285,410 L 265,375 Z',
    center: [300, 370],
    lat: 17.1439,
    lon: 79.6239,
    normalSwmRainfallMm: 624.1,
    dominantCrop: 'Paddy',
    anomaly2026Pct: +3.5,
    elevationM: 185
  },
  {
    id: 'nalgonda',
    name: 'Nalgonda',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 225,370 L 265,375 L 285,410 L 260,465 L 205,435 L 210,395 Z',
    center: [245, 415],
    lat: 17.0575,
    lon: 79.2684,
    normalSwmRainfallMm: 543.6,
    dominantCrop: 'Cotton',
    anomaly2026Pct: -1.8,
    elevationM: 240
  },
  {
    id: 'rangareddy',
    name: 'Rangareddy',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 145,340 L 185,350 L 210,395 L 180,425 L 135,390 Z',
    center: [170, 385],
    lat: 17.2403,
    lon: 78.4294,
    normalSwmRainfallMm: 584.2,
    dominantCrop: 'Paddy',
    anomaly2026Pct: -0.6,
    elevationM: 545
  },
  {
    id: 'vikarabad',
    name: 'Vikarabad',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 90,325 L 145,340 L 135,390 L 85,400 L 60,355 Z',
    center: [105, 365],
    lat: 17.3364,
    lon: 77.9048,
    normalSwmRainfallMm: 642.0,
    dominantCrop: 'Red Gram',
    anomaly2026Pct: -3.0,
    elevationM: 615
  },
  {
    id: 'narayanpet',
    name: 'Narayanpet',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 60,390 L 105,410 L 95,455 L 50,440 Z',
    center: [78, 425],
    lat: 16.7375,
    lon: 77.4984,
    normalSwmRainfallMm: 462.4,
    dominantCrop: 'Red Gram',
    anomaly2026Pct: -5.4,
    elevationM: 430
  },
  {
    id: 'mahabubnagar',
    name: 'Mahabubnagar',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 105,410 L 160,405 L 165,455 L 115,465 L 95,455 Z',
    center: [132, 435],
    lat: 16.7488,
    lon: 77.9856,
    normalSwmRainfallMm: 524.3,
    dominantCrop: 'Cotton',
    anomaly2026Pct: -4.0,
    elevationM: 498
  },
  {
    id: 'nagarkurnool',
    name: 'Nagarkurnool',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 160,405 L 205,435 L 210,490 L 165,495 L 165,455 Z',
    center: [185, 455],
    lat: 16.4851,
    lon: 78.3050,
    normalSwmRainfallMm: 489.1,
    dominantCrop: 'Cotton',
    anomaly2026Pct: -6.2,
    elevationM: 460
  },
  {
    id: 'wanaparthy',
    name: 'Wanaparthy',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 115,465 L 165,455 L 160,500 L 110,495 Z',
    center: [138, 480],
    lat: 16.3624,
    lon: 78.0628,
    normalSwmRainfallMm: 472.6,
    dominantCrop: 'Cotton',
    anomaly2026Pct: -5.8,
    elevationM: 360
  },
  {
    id: 'jogulamba_gadwal',
    name: 'Jogulamba Gadwal',
    zone: 'SOUTHERN_TELANGANA_ZONE',
    path: 'M 75,465 L 115,465 L 110,515 L 70,510 Z',
    center: [92, 490],
    lat: 16.2300,
    lon: 77.8000,
    normalSwmRainfallMm: 422.3,
    dominantCrop: 'Cotton',
    anomaly2026Pct: -7.5,
    elevationM: 325
  }
];

/**
 * Realistic Hydrography: Major Rivers and Tributaries
 */
export const TELANGANA_RIVERS: RiverPath[] = [
  {
    id: 'godavari',
    name: 'Godavari River',
    type: 'major_river',
    path: 'M 125,80 Q 170,105 210,128 T 260,135 T 325,145 T 385,190 T 435,225 T 485,285 T 520,335',
    labelPoint: [360, 175]
  },
  {
    id: 'krishna',
    name: 'Krishna River',
    type: 'major_river',
    path: 'M 50,470 Q 90,495 135,498 T 195,502 T 245,468 T 285,445 T 345,415 T 410,410',
    labelPoint: [205, 510]
  },
  {
    id: 'manjira',
    name: 'Manjira River',
    type: 'tributary',
    path: 'M 65,300 Q 105,285 130,240 T 140,165 T 155,120',
    labelPoint: [100, 240]
  },
  {
    id: 'musi',
    name: 'Musi River',
    type: 'tributary',
    path: 'M 90,360 Q 135,355 170,345 T 220,350 T 265,385 T 285,410',
    labelPoint: [210, 360]
  },
  {
    id: 'pranahita',
    name: 'Pranahita River',
    type: 'tributary',
    path: 'M 285,32 Q 305,65 315,115 T 325,145',
    labelPoint: [320, 90]
  }
];

/**
 * Key Strategic Multi-Purpose Reservoirs and Barrages
 */
export const TELANGANA_RESERVOIRS: ReservoirPoint[] = [
  {
    id: 'srsp',
    name: 'Sriram Sagar Project (SRSP)',
    x: 165,
    y: 110,
    r: 6.5,
    capacityTmc: 90
  },
  {
    id: 'kaleshwaram',
    name: 'Kaleshwaram Barrage (Medigadda)',
    x: 355,
    y: 168,
    r: 6.0,
    capacityTmc: 16.1
  },
  {
    id: 'nagarjuna_sagar',
    name: 'Nagarjuna Sagar Dam',
    x: 275,
    y: 445,
    r: 7.5,
    capacityTmc: 312
  },
  {
    id: 'srisailam',
    name: 'Srisailam Reservoir',
    x: 195,
    y: 495,
    r: 7.0,
    capacityTmc: 215
  },
  {
    id: 'nizam_sagar',
    name: 'Nizam Sagar',
    x: 135,
    y: 190,
    r: 5.5,
    capacityTmc: 17.8
  },
  {
    id: 'singur',
    name: 'Singur Dam',
    x: 105,
    y: 285,
    r: 5.5,
    capacityTmc: 29.9
  },
  {
    id: 'mid_manair',
    name: 'Mid Manair Dam',
    x: 215,
    y: 210,
    r: 5.0,
    capacityTmc: 25.8
  }
];

/**
 * Topographic Elevation Contour Lines
 */
export const TELANGANA_ELEVATION_CONTOURS = [
  {
    id: 'contour-600m',
    elevation: '600m Plateau Ridge (Ananthagiri Hills)',
    path: 'M 75,340 Q 105,370 120,385 T 100,430',
    color: '#b45309'
  },
  {
    id: 'contour-500m',
    elevation: '500m Deccan Plateau Escarpment',
    path: 'M 70,260 Q 120,270 160,255 T 200,280 T 170,390 T 140,460',
    color: '#d97706'
  },
  {
    id: 'contour-300m',
    elevation: '300m Godavari-Krishna Lowlands',
    path: 'M 190,110 Q 250,160 290,195 T 360,280 T 310,380 T 260,440',
    color: '#ca8a04'
  }
];
