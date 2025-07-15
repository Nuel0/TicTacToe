import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings, Play, Heart, Coffee } from 'lucide-react';
import { CoinDisplay } from './CoinDisplay';

interface HomeProps {
  onStartSetup: () => void;
  onSettings: () => void;
}

export function Home({ onStartSetup, onSettings }: HomeProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 bg-accent/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 sm:w-24 h-16 sm:h-24 bg-secondary/15 rounded-full blur-lg"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-lg space-y-6 sm:space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="space-y-2 sm:space-y-3">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 rounded-full text-primary text-xs sm:text-sm">
                <Coffee className="h-3 sm:h-4 w-3 sm:w-4" />
                Cozy Gaming by Nuel
              </div>
              <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-primary via-primary/80 to-accent-foreground bg-clip-text text-transparent">
                Tic Tac Toe
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                A warm & friendly take on the classic game
              </p>
            </div>
            <div className="flex-1 flex justify-end items-start gap-2 sm:gap-3">
              <CoinDisplay variant="header" showRecentReward />
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettings}
                className="rounded-full hover:bg-primary/10 transition-colors w-8 h-8 sm:w-10 sm:h-10"
              >
                <Settings className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="text-center pb-3 sm:pb-4">
            <CardTitle className="flex items-center justify-center gap-2 sm:gap-3 text-xl sm:text-2xl">
              <div className="p-2 sm:p-3 rounded-full bg-primary/15">
                <Heart className="h-5 sm:h-6 w-5 sm:w-6 text-primary fill-current" />
              </div>
              Welcome, Friend!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-center text-muted-foreground leading-relaxed text-sm sm:text-base">
              Ready for a delightful game of Tic-Tac-Toe? Whether you want to challenge our friendly AI or play with someone special, we've got you covered!
            </p>
            
            <div className="bg-muted/50 rounded-xl p-3 sm:p-4 space-y-2">
              <h4 className="text-xs sm:text-sm text-muted-foreground">✨ What makes us special:</h4>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Smart AI
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Cozy Design
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Local Play
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Sound Effects
                </div>
              </div>
            </div>

            <Button
              size="lg"
              onClick={onStartSetup}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12 sm:h-auto p-[16px] px-[16px] py-[18px]"
            >
              <Play className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
              Let's Play Together!
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Made with 🤎 for cozy moments
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground flex-wrap">
            <span>Perfect for</span>
            <span className="px-2 py-1 bg-primary/10 rounded-full">coffee breaks</span>
            <span>&</span>
            <span className="px-2 py-1 bg-primary/10 rounded-full">friend time</span>
          </div>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">
            Copyright © Nuel Wogundu
          </p>
        </div>
      </div>
    </div>
  );
}