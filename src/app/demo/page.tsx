'use client';

import { useState } from 'react';
import { GridBackground } from '@/components/ui/GridBackground';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LoadingCard } from '@/components/ui/LoadingSpinner';
import { CheckCircle2Icon, AlertCircle } from 'lucide-react';

export default function DemoPage() {
  const [progress, setProgress] = useState(66);

  return (
    <GridBackground className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-black mb-4">Neo-Brutalism UI Demo</h1>
          <p className="text-xl font-bold text-gray-700">Bold, chunky, and unapologetically brutalist</p>
        </div>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="neutral">Neutral Button</Button>
            <Button variant="noShadow">No Shadow</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>This is a basic card with neo-brutalism styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">Cards have thick black borders and bold shadows that create depth and visual interest.</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-400">
              <CardHeader>
                <CardTitle>Colored Card</CardTitle>
                <CardDescription>Cards can have different background colors</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">The neo-brutalism style works great with bright, saturated colors.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Action Button</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Form Elements</h2>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Login Form</CardTitle>
              <CardDescription>Example form with neo-brutalism inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Sign In</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Progress */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Progress Bar</h2>
          <Card className="max-w-md">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Loading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setProgress(Math.min(100, progress + 10))}>
                  Increase
                </Button>
                <Button variant="neutral" onClick={() => setProgress(Math.max(0, progress - 10))}>
                  Decrease
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alerts */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Alerts</h2>
          <div className="space-y-4 max-w-2xl">
            <Alert className="bg-green-400">
              <CheckCircle2Icon />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your changes have been saved successfully.
              </AlertDescription>
            </Alert>

            <Alert className="bg-red-400 text-white border-black">
              <AlertCircle />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Something went wrong. Please try again.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Loading Card */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Loading States</h2>
          <LoadingCard 
            title="Processing Request"
            description="Please wait while we fetch your data..."
          />
        </section>

        {/* Grid Background Demo */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Grid Background</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="font-medium mb-4">
                The entire page uses a subtle grid background that adds texture without being distracting.
                This is a key element of the neo-brutalism aesthetic.
              </p>
              <div className="bg-white border-4 border-black p-8 relative overflow-hidden">
                <div 
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, black 1px, transparent 1px),
                      linear-gradient(to bottom, black 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }}
                />
                <p className="relative z-10 font-bold text-center">
                  Grid lines visible at higher opacity
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Color Palette */}
        <section className="space-y-4">
          <h2 className="text-3xl font-black text-black">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-400 border-4 border-black shadow-base p-6 text-center">
              <p className="font-black text-black">Yellow</p>
              <p className="text-sm font-bold">#FFE66D</p>
            </div>
            <div className="bg-teal-400 border-4 border-black shadow-base p-6 text-center">
              <p className="font-black text-black">Teal</p>
              <p className="text-sm font-bold">#4ECDC4</p>
            </div>
            <div className="bg-red-400 border-4 border-black shadow-base p-6 text-center">
              <p className="font-black text-white">Red</p>
              <p className="text-sm font-bold text-white">#FF6B6B</p>
            </div>
            <div className="bg-purple-300 border-4 border-black shadow-base p-6 text-center">
              <p className="font-black text-black">Purple</p>
              <p className="text-sm font-bold">#DDD6FE</p>
            </div>
          </div>
        </section>
      </div>
    </GridBackground>
  );
}
