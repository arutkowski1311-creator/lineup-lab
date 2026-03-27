"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address",
  className,
}: AddressInputProps) {
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof google !== "undefined" && google.maps) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      const div = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      { input, types: ["address"], componentRestrictions: { country: "us" } },
      (results) => {
        setPredictions(results || []);
        setShowDropdown(true);
      }
    );
  }, []);

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);

    if (onSelect && placesService.current) {
      placesService.current.getDetails(
        { placeId: prediction.place_id, fields: ["geometry", "formatted_address"] },
        (place) => {
          if (place?.geometry?.location) {
            onSelect({
              address: place.formatted_address || prediction.description,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fallback for when Google Maps isn't loaded
  const isGoogleLoaded = typeof google !== "undefined" && google.maps;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (isGoogleLoaded) {
              fetchPredictions(e.target.value);
            }
          }}
          placeholder={placeholder}
          className={`pl-9 ${className || ""}`}
        />
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
