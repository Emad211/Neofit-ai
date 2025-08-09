
'use client';

import * as React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { foodLookup, FoodLookupOutput } from '@/ai/flows/food-lookup';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Loader2, Wheat } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useUserData } from '@/context/user-profile-context';
import { useToast } from '@/hooks/use-toast';

const searchSchema = z.object({
  query: z.string().min(2, 'Please enter at least 2 characters.'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

const NutrientDisplay = ({ label, value, unit }: { label: string, value: number, unit: string }) => (
    <div className="text-center bg-secondary p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}<span className="text-sm text-primary/80">{unit}</span></p>
    </div>
);


export function FoodLibrary() {
  const [result, setResult] = React.useState<FoodLookupOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { user, userProfile } = useUserData();
  const { toast } = useToast();
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
  });

  const onSubmit: SubmitHandler<SearchFormValues> = async (data) => {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'User not found',
        description: 'Please log in to use this feature.'
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await foodLookup({ userId: user.uid, foodName: data.query, geminiApiKey: userProfile.geminiApiKey });
      setResult(response);
    } catch (e) {
      console.error(e);
      setError('Could not find information for that food. Please try another search.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2 mb-8">
        <Input 
            {...form.register('query')}
            placeholder="e.g., 1 cup of greek yogurt"
            className="text-base"
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </form>

       {form.formState.errors.query && (
            <p className="text-destructive text-sm mt-1">{form.formState.errors.query.message}</p>
        )}

      <div>
        {isLoading && (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )}
        {error && <p className="text-destructive text-center">{error}</p>}
        {result && (
          <Card className="animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{result.itemName}</CardTitle>
                <p className="text-muted-foreground">Serving Size: {result.servingSize}</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NutrientDisplay label="Calories" value={result.calories} unit="kcal" />
                <NutrientDisplay label="Protein" value={result.protein} unit="g" />
                <NutrientDisplay label="Carbs" value={result.carbohydrates} unit="g" />
                <NutrientDisplay label="Fat" value={result.fat} unit="g" />
            </CardContent>
          </Card>
        )}
         {!isLoading && !result && !error && (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Wheat className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Search for a food</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Get detailed nutritional information to help you stay on track.
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
