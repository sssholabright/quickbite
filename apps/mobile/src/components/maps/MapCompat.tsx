import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

let Mapbox: any = null;
try {
	Mapbox = require('@rnmapbox/maps');
	// Set token at runtime (public token)
	if (process.env.EXPO_PUBLIC_MAPBOX_TOKEN) {
		Mapbox.default?.setAccessToken?.(process.env.EXPO_PUBLIC_MAPBOX_TOKEN);
	}
} catch {
	// ignore, placeholder fallback below
}

type LatLng = { latitude: number; longitude: number };
type Annotation = { id: string; coordinates: LatLng; title?: string; tintColor?: string };
type Polyline = { id: string; coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number };
type Route = { 
	id: string; 
	from: LatLng; 
	to: LatLng; 
	strokeColor?: string; 
	strokeWidth?: number;
	profile?: 'driving' | 'walking' | 'cycling';
};

type Props = {
	style?: StyleProp<ViewStyle>;
	region: {
		latitude: number;
		longitude: number;
		latitudeDelta: number;
		longitudeDelta: number;
	};
	annotations?: Annotation[];
	polylines?: Polyline[];
	routes?: Route[];
};

export default function MapCompat({ style, region, annotations, polylines, routes }: Props) {
	const [routeGeometries, setRouteGeometries] = useState<{[key: string]: any}>({});

	if (!Mapbox?.MapView) {
		return <View style={[{ backgroundColor: 'transparent' }, style]} />;
	}

	const center: [number, number] = [region.longitude, region.latitude];

	// Fetch route geometries from Mapbox Directions API
	useEffect(() => {
		if (!routes || !process.env.EXPO_PUBLIC_MAPBOX_TOKEN) {
			console.log('MapCompat: Missing routes or token', { routes: !!routes, token: !!process.env.EXPO_PUBLIC_MAPBOX_TOKEN });
			return;
		}

		routes.forEach(async (route) => {
			// Skip if driver has arrived (same location)
			const isSameLocation = route.from.latitude === route.to.latitude && 
								  route.from.longitude === route.to.longitude;
			
			if (isSameLocation) {
				// Remove the route from state when driver arrives
				setRouteGeometries(prev => {
					const newState = { ...prev };
					delete newState[route.id];
					return newState;
				});
				return;
			}

			try {
				const from = `${route.from.longitude},${route.from.latitude}`;
				const to = `${route.to.longitude},${route.to.latitude}`;
				const profile = route.profile || 'driving';
				
				const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from};${to}?geometries=geojson&access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`;
				
				const response = await fetch(url);
				const data = await response.json();
				
				if (data.routes && data.routes.length > 0) {
					setRouteGeometries(prev => ({
						...prev,
						[route.id]: data.routes[0].geometry
					}));
				}
			} catch (error) {
				console.error('Error fetching route:', error);
			}
		});
	}, [routes?.map(r => `${r.from.latitude},${r.from.longitude},${r.to.latitude},${r.to.longitude}`).join('|')]);

	const lineSources = useMemo(() => {
		const sources = [];
		
		// Add polylines (straight lines)
		if (polylines) {
			sources.push(...polylines.map((p) => ({
				id: p.id,
				geojson: {
					type: 'Feature',
					geometry: {
						type: 'LineString',
						coordinates: p.coordinates.map(c => [c.longitude, c.latitude]),
					},
					properties: {},
				},
				color: p.strokeColor ?? '#3b82f6',
				width: p.strokeWidth ?? 4,
			})));
		}

		// Add routes (road-following lines)
		if (routes) {
			sources.push(...routes.map((route) => {
				// Skip routes where from and to are the same (driver has arrived)
				const isSameLocation = route.from.latitude === route.to.latitude && 
									  route.from.longitude === route.to.longitude;
				
				if (isSameLocation) {
					return null; // Don't render route when driver has arrived
				}

				return {
					id: route.id,
					geojson: routeGeometries[route.id] || {
						type: 'Feature',
						geometry: {
							type: 'LineString',
							coordinates: [[route.from.longitude, route.from.latitude], [route.to.longitude, route.to.latitude]],
						},
						properties: {},
					},
					color: route.strokeColor ?? '#3b82f6',
					width: route.strokeWidth ?? 4,
				};
			}).filter(Boolean)); // Remove null entries
		}

		return sources;
	}, [polylines, routes, routeGeometries]);

	return (
		<Mapbox.MapView style={style} styleURL={Mapbox.StyleURL?.Street}>
			<Mapbox.Camera centerCoordinate={center} zoomLevel={14} />
			{annotations?.map(a => (
				<Mapbox.PointAnnotation
					key={a.id}
					id={a.id}
					coordinate={[a.coordinates.longitude, a.coordinates.latitude]}
					title={a.title}
				/>
			))}
			{lineSources.map(ls => (
				<Mapbox.ShapeSource id={ls?.id} key={ls?.id} shape={ls?.geojson}>
					<Mapbox.LineLayer
						id={`${ls?.id}-line`}
						style={{ lineColor: ls?.color, lineWidth: ls?.width }}
					/>
				</Mapbox.ShapeSource>
			))}
		</Mapbox.MapView>
	);
}