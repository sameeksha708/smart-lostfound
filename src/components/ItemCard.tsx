import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";

interface ItemCardProps {
  id: string;
  name: string;
  description: string | null;
  location: string;
  dateOccurred: string;
  imageUrl: string | null;
  type: "lost" | "found";
  status: "active" | "claimed" | "returned";
  onClaim?: (itemId: string) => void;
  showClaimButton?: boolean;
  userEmail?: string;
}

const ItemCard = ({
  id,
  name,
  description,
  location,
  dateOccurred,
  imageUrl,
  type,
  status,
  onClaim,
  showClaimButton = false,
  userEmail,
}: ItemCardProps) => {
  const typeColor = type === "lost" ? "lost" : "found";
  
  return (
    <Card className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 border-border">
      {imageUrl && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
          <Badge 
            className={`${type === "lost" ? "bg-lost text-lost-foreground" : "bg-found text-found-foreground"} shrink-0`}
          >
            {type === "lost" ? "Lost" : "Found"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{format(new Date(dateOccurred), "MMM dd, yyyy")}</span>
          </div>

          {userEmail && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 shrink-0" />
              <span className="line-clamp-1 text-xs">{userEmail}</span>
            </div>
          )}
        </div>

        {status !== "active" && (
          <Badge variant="outline" className="mt-2">
            {status === "claimed" ? "Claim Pending" : "Returned"}
          </Badge>
        )}
      </CardContent>

      {showClaimButton && status === "active" && onClaim && (
        <CardFooter>
          <Button 
            onClick={() => onClaim(id)}
            className="w-full"
            variant="outline"
          >
            Claim This Item
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ItemCard;
