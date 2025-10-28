import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface MyClaimsProps {
  userId: string;
}

interface Claim {
  id: string;
  status: "pending" | "approved" | "rejected";
  proof_description: string;
  proof_image_url: string | null;
  admin_note: string | null;
  created_at: string;
  items: {
    name: string;
    type: "lost" | "found";
    location: string;
  };
}

const MyClaims = ({ userId }: MyClaimsProps) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, [userId]);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from("claims")
        .select(`
          *,
          items:item_id (name, type, location)
        `)
        .eq("claimant_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-found" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-700 border-amber-200",
      approved: "bg-found-light text-found border-found",
      rejected: "bg-destructive/10 text-destructive border-destructive",
    };

    return (
      <Badge className={variants[status]} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading claims...</p>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">You haven't made any claims yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="shadow-soft border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{claim.items.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {claim.items.type === "lost" ? "Lost" : "Found"} at {claim.items.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(claim.status)}
                {getStatusBadge(claim.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Your Proof:</p>
              <p className="text-sm text-muted-foreground">{claim.proof_description}</p>
            </div>

            {claim.proof_image_url && (
              <div>
                <p className="text-sm font-medium mb-2">Proof Image:</p>
                <img
                  src={claim.proof_image_url}
                  alt="Proof"
                  className="max-w-xs rounded-lg border border-border"
                />
              </div>
            )}

            {claim.admin_note && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Admin Note:</p>
                <p className="text-sm text-muted-foreground">{claim.admin_note}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Submitted on {format(new Date(claim.created_at), "MMM dd, yyyy 'at' HH:mm")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyClaims;
