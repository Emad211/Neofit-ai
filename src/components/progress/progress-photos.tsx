import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Upload } from "lucide-react";

const photoData = [
    { date: '2023-10-01', src: 'https://placehold.co/600x400.png', alt: 'Front view', dataAiHint: 'person standing' },
    { date: '2023-10-01', src: 'https://placehold.co/600x400.png', alt: 'Side view', dataAiHint: 'person side' },
    { date: '2023-11-01', src: 'https://placehold.co/600x400.png', alt: 'Front view', dataAiHint: 'person standing' },
    { date: '2023-11-01', src: 'https://placehold.co/600x400.png', alt: 'Side view', dataAiHint: 'person side' },
]

export function ProgressPhotos() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">Progress Photos</CardTitle>
        <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photoData.map((photo, index) => (
                <div key={index} className="group relative">
                    <Image 
                        src={photo.src} 
                        alt={photo.alt} 
                        width={400} 
                        height={400} 
                        className="rounded-lg aspect-square object-cover"
                        data-ai-hint={photo.dataAiHint}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1 rounded-b-lg">
                        {photo.date}
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
