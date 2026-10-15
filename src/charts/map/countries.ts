import iso from 'iso-3166-1';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countries from 'world-atlas/countries-110m.json';

const topology = countries as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;

/** Every country shape in the bundled atlas, keyed by its numeric ISO 3166-1 code. */
export const shapes = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>;

const alpha3ByNumeric = new Map(iso.all().map((c) => [c.numeric.padStart(3, '0'), c.alpha3]));

/** The ISO 3166-1 alpha-3 code of a shape, if it has one. */
export const alpha3Of = (f: Feature) => alpha3ByNumeric.get(String(f.id).padStart(3, '0'));

/** The shapes that have an alpha-3 code, with the code. */
export const coded = shapes.features.flatMap((f) => { const code = alpha3Of(f); return code ? [{ code, name: f.properties.name, shape: f as Feature<Geometry, { name: string }> }] : []; });
