import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ClaimDialogProps {
  itemId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ClaimDialog = ({ itemId, userId, onClose, onSuccess }: ClaimDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [proofDescription, setProofDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let proofImageUrl = null;

      // Upload image if selected
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        proofImageUrl = publicUrl;
        setUploading(false);
      }

      const { error } = await supabase.from("claims").insert({
        item_id: itemId,
        claimant_id: userId,
        proof_description: proofDescription || null,
        proof_image_url: proofImageUrl,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Claim submitted successfully! Waiting for admin approval.");
      setProofDescription("");
      setImageFile(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit claim");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Claim This Item</DialogTitle>
          <DialogDescription>
            Provide proof of ownership to claim this item. An admin will review your claim.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proof-description">Proof Description *</Label>
            <Textarea
              id="proof-description"
              placeholder="Describe why this item belongs to you (e.g., unique features, purchase details, etc.)"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof-image">Proof Image (optional)</Label>
            <Input
              id="proof-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {imageFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading} className="flex-1">
              {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? "Uploading..." : "Submit Claim"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimDialog;
