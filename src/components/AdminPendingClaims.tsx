import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Claim {
  id: string;
  status: "pending" | "approved" | "rejected";
  proof_description: string;
  proof_image_url: string | null;
  created_at: string;
  items: {
    id: string;
    name: string;
    type: "lost" | "found";
    location: string;
    image_url: string | null;
  };
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const AdminPendingClaims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from("claims")
        .select(`
          *,
          items:item_id (id, name, type, location, image_url),
          profiles:claimant_id (email, full_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClaim = async (claimId: string, itemId: string, newStatus: "approved" | "rejected") => {
    setProcessingId(claimId);

    try {
      const { error: claimError } = await supabase
        .from("claims")
        .update({
          status: newStatus,
          admin_note: adminNotes[claimId] || null,
        })
        .eq("id", claimId);

      if (claimError) throw claimError;

      // If approved, update item status
      if (newStatus === "approved") {
        const { error: itemError } = await supabase
          .from("items")
          .update({ status: "claimed" })
          .eq("id", itemId);

        if (itemError) throw itemError;
      }

      toast.success(`Claim ${newStatus} successfully!`);
      fetchClaims();
    } catch (error: any) {
      toast.error(error.message || "Failed to update claim");
    } finally {
      setProcessingId(null);
    }
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
        <p className="text-muted-foreground">No pending claims</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border border-border">
        <p className="text-center">
          <span className="text-2xl font-bold text-primary">{claims.length}</span>
          <span className="text-muted-foreground ml-2">Pending Claims</span>
        </p>
      </div>

      <div className="space-y-4">
        {claims.map((claim) => (
          <Card key={claim.id} className="shadow-soft border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{claim.items.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={claim.items.type === "lost" ? "bg-lost text-lost-foreground" : "bg-found text-found-foreground"}>
                      {claim.items.type === "lost" ? "Lost" : "Found"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">at {claim.items.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Claimed by: {claim.profiles.full_name || claim.profiles.email}
                  </p>
                </div>
                {claim.items.image_url && (
                  <img
                    src={claim.items.image_url}
                    alt={claim.items.name}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Claimant's Proof:</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {claim.proof_description}
                </p>
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

              <div className="space-y-2">
                <Label htmlFor={`note-${claim.id}`}>Admin Note (optional)</Label>
                <Textarea
                  id={`note-${claim.id}`}
                  placeholder="Add a note about this decision..."
                  value={adminNotes[claim.id] || ""}
                  onChange={(e) =>
                    setAdminNotes({ ...adminNotes, [claim.id]: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleUpdateClaim(claim.id, claim.items.id, "approved")}
                  disabled={processingId === claim.id}
                  className="flex-1 bg-found hover:bg-found/90"
                >
                  {processingId === claim.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={() => handleUpdateClaim(claim.id, claim.items.id, "rejected")}
                  disabled={processingId === claim.id}
                  variant="destructive"
                  className="flex-1"
                >
                  {processingId === claim.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Submitted on {format(new Date(claim.created_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPendingClaims;
