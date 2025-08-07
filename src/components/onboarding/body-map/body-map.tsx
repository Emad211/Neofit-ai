"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBodyPart } from "./body-parts";
import "./body-map.css";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BodyContainer = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        width: "207px",
        height: "500px",
        margin: "10px auto"
    }}>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 375.42 832.97"
        >
            <g>
                {children}
            </g>
        </svg>
    </div>
);

const BodyPart = ({ id, d, fill, onClick, onMouseEnter, onMouseLeave }: { id: string; d: string; fill: string; onClick: (id: string) => void; onMouseEnter: (id: string) => void; onMouseLeave: (id: string) => void; }) => {
    const handleClick = () => {
        onClick(id);
    };

    const handleMouseEnter = () => {
        onMouseEnter(id);
    };

    const handleMouseLeave = () => {
        onMouseLeave(id);
    };

    return (
        <path
            d={d}
            id={id}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={Object.assign({}, {
                WebkitTapHighlightColor: "transparent",
                cursor: "pointer"
            }, { fill })}
        />
    );
};

export const BodyMap = () => {
    const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
    const [hovered, setHovered] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const bodyParts = useMemo(() => getBodyPart("en"), []); 

    const antBodyParts = useMemo(() => {
        return bodyParts.filter(({ face }) => face === "ant");
    }, [bodyParts]);

    const postBodyPart = useMemo(() => {
        return bodyParts.filter(({ face }) => face === "post");
    }, [bodyParts]);

    const getFill = useCallback((bodyPartId: string) => {
        if (selectedParts.has(bodyPartId)) return "hsl(var(--primary))";
        if (hovered === bodyPartId) return "hsl(var(--primary) / 0.5)";
        return "hsl(var(--muted-foreground))";
    }, [selectedParts, hovered]);

    const handleClick = (id: string) => {
        setSelectedParts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleMouseEnter = (id: string) => {
        if ("ontouchstart" in window) return;
        setHovered(id);
    };

    const handleMouseLeave = () => {
        if ("ontouchstart" in window) return;
        setHovered(null);
    };
    
    const handleSubmit = () => {
        const selectedPartNames = Array.from(selectedParts).map(id => `Previously injured: ${bodyParts.find(p => p.id === id)?.name || ''}`).filter(Boolean);
        const medicalHistory = searchParams.get('medicalHistory') || 'None';
        
        let combinedMedicalHistory = medicalHistory;
        if (selectedPartNames.length > 0) {
             if (combinedMedicalHistory === 'None') {
                combinedMedicalHistory = selectedPartNames.join('; ');
             } else {
                combinedMedicalHistory += '; ' + selectedPartNames.join('; ');
             }
        }
        
        const params = new URLSearchParams(searchParams);
        params.set('medicalHistory', combinedMedicalHistory || 'None');
        router.push(`/onboarding/analysis?${params.toString()}`);
    }

    const selectedPartNames = useMemo(() => 
        Array.from(selectedParts).map(id => bodyParts.find(p => p.id === id)?.name || '').filter(Boolean)
    , [selectedParts, bodyParts]);

    return (
        <div className="text-foreground">
            <div className="bodies-container">
                <div>
                    <p>Anterior side</p>
                    <BodyContainer>
                        {antBodyParts.map((bodyPart) => 
                            <BodyPart
                                key={bodyPart.id}
                                id={bodyPart.id}
                                d={bodyPart.d}
                                fill={getFill(bodyPart.id)}
                                onClick={handleClick} 
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        )}
                    </BodyContainer>
                </div>
                <div>
                    <p>Posterior side</p>
                    <BodyContainer>
                        {postBodyPart.map((bodyPart) => 
                            <BodyPart
                                key={bodyPart.id}
                                id={bodyPart.id}
                                d={bodyPart.d}
                                fill={getFill(bodyPart.id)}
                                onClick={handleClick} 
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        )}
                    </BodyContainer>
                </div>
            </div>
            <div className="selected-parts-container">
                <h3 className="text-lg font-semibold">Selected Areas:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPartNames.length > 0 ? selectedPartNames.map(name => (
                        <Badge key={name} variant="secondary" className="text-base">{name}</Badge>
                    )) : <p className="text-muted-foreground">None selected</p>}
                </div>
            </div>
            <div className="mt-8 text-center">
                 <Button onClick={handleSubmit} size="lg" className="w-full max-w-md mx-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                    Analyze My Profile <MoveRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};
