import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Trophy, Star, Calendar, Target, Medal, Flame } from 'lucide-react';

interface GamificationCardProps {
  userProgress: {
    points: number;
    streak: number;
    level: number;
    achievements: number[];
    levelInfo: {
      level: number;
      title: string;
      minPoints: number;
      maxPoints: number;
    };
  };
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: Date;
  }>;
}

export default function GamificationCard({ userProgress, achievements }: GamificationCardProps) {
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  
  // Calculate progress percentage to next level
  const currentPoints = userProgress.points;
  const minPoints = userProgress.levelInfo.minPoints;
  const maxPoints = userProgress.levelInfo.maxPoints;
  const nextLevelProgress = Math.min(
    Math.round(((currentPoints - minPoints) / (maxPoints - minPoints)) * 100),
    100
  );
  
  // Get icon for achievement
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star':
        return <Star className="h-6 w-6" />;
      case 'Trophy':
        return <Trophy className="h-6 w-6" />;
      case 'Medal':
        return <Medal className="h-6 w-6" />;
      case 'Calendar':
        return <Calendar className="h-6 w-6" />;
      case 'Target':
        return <Target className="h-6 w-6" />;
      case 'Award':
        return <Award className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };
  
  // Get unlocked achievements
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const recentAchievements = unlockedAchievements.slice(0, 3);
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-medium flex items-center">
          <Award className="mr-2 h-5 w-5 text-primary" />
          Достижения и прогресс
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Level and points info */}
        <div className="flex flex-col mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-medium">{userProgress.levelInfo.title}</h3>
              <p className="text-sm text-gray-500">Уровень {userProgress.level}</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-medium">{userProgress.points}</h3>
              <p className="text-sm text-gray-500">Очки</p>
            </div>
          </div>
          
          <Progress value={nextLevelProgress} className="h-2 mb-1" />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{userProgress.levelInfo.minPoints} очков</span>
            <span>До следующего уровня: {userProgress.levelInfo.maxPoints - userProgress.points} очков</span>
          </div>
        </div>
        
        {/* Streak */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6 flex items-center">
          <Flame className="h-12 w-12 text-orange-500 mr-4" />
          <div>
            <h4 className="font-medium">Серия посещений</h4>
            <div className="flex items-end">
              <span className="text-2xl font-bold mr-1">{userProgress.streak}</span>
              <span className="text-sm text-gray-500 mb-1">дней подряд</span>
            </div>
            <p className="text-xs text-gray-500">Приходите на занятия каждый день, чтобы увеличить серию!</p>
          </div>
        </div>
        
        {/* Recent achievements */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Недавние достижения</h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="text-primary">
                  Показать все
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ваши достижения</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`flex items-center p-3 rounded-lg ${
                        achievement.unlocked 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-full mr-3 ${
                        achievement.unlocked ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div>
                        <h5 className="font-medium">{achievement.name}</h5>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                      </div>
                      <Badge variant={achievement.unlocked ? "default" : "outline"} className="ml-auto">
                        {achievement.unlocked ? 'Разблокировано' : 'Заблокировано'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAchievements.length > 0 ? (
              recentAchievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex flex-col items-center text-center"
                >
                  <div className="p-3 bg-primary/20 rounded-full text-primary mb-2">
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  <h5 className="font-medium">{achievement.name}</h5>
                  <p className="text-xs text-gray-500">{achievement.description}</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-6 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Пока нет достижений. Начните отмечать посещения, чтобы получить награды!</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}