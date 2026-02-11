'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, Check, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandEmpty,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import 'leaflet/dist/leaflet.css';

// ✅ Import TYPES normally
import type {
    MapContainerProps,
    TileLayerProps,
    MarkerProps,
} from 'react-leaflet';

// ✅ Typed dynamic imports
const MapContainer = dynamic(
    async () => {
        const mod = await import('react-leaflet');
        return mod.MapContainer;
    },
    { ssr: false }
) as React.FC<MapContainerProps>;

const TileLayer = dynamic(
    async () => {
        const mod = await import('react-leaflet');
        return mod.TileLayer;
    },
    { ssr: false }
) as React.FC<TileLayerProps>;

const Marker = dynamic(
    async () => {
        const mod = await import('react-leaflet');
        return mod.Marker;
    },
    { ssr: false }
) as React.FC<MarkerProps>;

// ---------------- MAP EFFECT ----------------
function ChangeView({ center }: { center: [number, number] }) {
    const { useMap } = require('react-leaflet');
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom(), { animate: true });
    }, [center, map]);

    return null;
}

const MapEffect = dynamic(() => Promise.resolve(ChangeView), { ssr: false });

// ---------------- TYPES ----------------
type Suggestion = {
    name: string;
    city?: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
    formatted: string;
};

interface LocationSelectorProps {
    value: string;
    latitude?: number;
    longitude?: number;
    onChange: (value: string) => void;
    onCoordsChange: (lat: number, lon: number) => void;
}

// ---------------- COMPONENT ----------------
export function LocationSelector({
    value,
    latitude,
    longitude,
    onChange,
    onCoordsChange,
}: LocationSelectorProps) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState<[number, number]>([
        latitude ?? 51.505,
        longitude ?? -0.09,
    ]);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (latitude && longitude) {
            setCoords([latitude, longitude]);
        }
    }, [latitude, longitude]);

    // ---------------- FETCH SUGGESTIONS ----------------
    const fetchSuggestions = useCallback(async (text: string) => {
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`
            );
            const data = await res.json();

            const results: Suggestion[] = data.features.map((f: any) => {
                const p = f.properties;
                return {
                    name: p.name,
                    city: p.city,
                    state: p.state,
                    country: p.country,
                    lat: f.geometry.coordinates[1],
                    lon: f.geometry.coordinates[0],
                    formatted: [p.name, p.city, p.state, p.country].filter(Boolean).join(', '),
                };
            });

            setSuggestions(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => query && fetchSuggestions(query), 300);
        return () => clearTimeout(t);
    }, [query, fetchSuggestions]);

    // ---------------- HANDLE SELECT ----------------
    const handleSelect = (s: Suggestion) => {
        onChange(s.formatted);
        onCoordsChange(s.lat, s.lon);
        setCoords([s.lat, s.lon]);
        setOpen(false);
    };

    // ---------------- FIX LEAFLET ICON ----------------
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        }
    }, []);

    // ---------------- RENDER ----------------
    return (
        <div className="space-y-6">
            {/* SEARCH */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                        <div
                            className={cn(
                                'min-h-[3.5rem] rounded-2xl border pl-12 pr-4 py-4',
                                !value && 'text-muted-foreground'
                            )}
                        >
                            {value || 'Search for a venue or city...'}
                        </div>
                    </div>
                </PopoverTrigger>

                <PopoverContent className="p-0 w-full">
                    <Command shouldFilter={false}>
                        <CommandInput value={query} onValueChange={setQuery} />
                        <CommandList>
                            {loading && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                </div>
                            )}

                            {!loading && suggestions.length === 0 && query.length >= 3 && (
                                <CommandEmpty>No results found</CommandEmpty>
                            )}

                            <CommandGroup>
                                {suggestions.map((s, i) => (
                                    <CommandItem key={i} onSelect={() => handleSelect(s)}>
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <div className="flex-1">
                                            <div className="font-semibold">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {[s.city, s.state, s.country].filter(Boolean).join(', ')}
                                            </div>
                                        </div>
                                        {value === s.formatted && (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* MAP */}
            <div className="h-72 rounded-3xl overflow-hidden border">
                {mounted && (
                    <MapContainer
                        center={coords}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="© OpenStreetMap contributors"
                        />
                        <Marker position={coords} />
                        <MapEffect center={coords} />
                    </MapContainer>
                )}
            </div>
        </div>
    );
}
