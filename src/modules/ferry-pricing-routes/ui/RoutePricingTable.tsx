'use client'

import React, { useState } from 'react';
import { FerryRoute } from "@/modules/ferry-booking-routes/domain/types";
import { PriceProfile } from "../domain/types";
import { updateRoutePricing } from "../application/actions";

interface Props {
    tenantId: string;
    routes: FerryRoute[];
    profiles: PriceProfile[];
}

export function RoutePricingTable({ tenantId, routes, profiles }: Props) {
    const [updating, setUpdating] = useState<string | null>(null);

    const handleProfileChange = async (routeId: string, profileId: string) => {
        setUpdating(routeId);
        try {
            await updateRoutePricing(tenantId, routeId, profileId === 'default' ? null : profileId);
        } catch (e) {
            alert("Failed to update pricing profile");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 font-medium text-gray-500">Route</th>
                        <th className="p-4 font-medium text-gray-500">Origin</th>
                        <th className="p-4 font-medium text-gray-500">Destination</th>
                        <th className="p-4 font-medium text-gray-500">Duration</th>
                        <th className="p-4 font-medium text-gray-500">Default Price Profile</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {routes.map(route => (
                        <tr key={route.id} className="hover:bg-gray-50">
                            <td className="p-4 font-medium">
                                {route.origin?.name} → {route.destination?.name}
                            </td>
                            <td className="p-4 text-gray-600">{route.origin?.name}</td>
                            <td className="p-4 text-gray-600">{route.destination?.name}</td>
                            <td className="p-4 text-gray-600">{route.estimatedDurationMinutes} min</td>
                            <td className="p-4">
                                <select
                                    className="border rounded px-3 py-2 w-full max-w-xs focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={route.defaultPriceProfileId || 'default'}
                                    onChange={(e) => handleProfileChange(route.id, e.target.value)}
                                    disabled={updating === route.id}
                                >
                                    <option value="default">-- Select Profile --</option>
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.currency})
                                        </option>
                                    ))}
                                </select>
                                {updating === route.id && <span className="ml-2 text-xs text-blue-500">Saving...</span>}
                            </td>
                        </tr>
                    ))}
                    {routes.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                No routes found. Please define routes in Fleet Management first.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
