import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  gradient: string;
  progress?: number;
}

const ActivityCard = ({ title, value, unit, icon: Icon, gradient, progress }: ActivityCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-glow transition-all duration-300 overflow-hidden group">
      <div className={`h-1 ${gradient}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {progress !== undefined && (
              <div className="mt-3">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${gradient} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{progress}% of goal</p>
              </div>
            )}
          </div>
          <div className={`p-3 ${gradient} rounded-xl shadow-glow group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;