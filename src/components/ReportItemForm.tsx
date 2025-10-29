import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReportItemFormProps {
  type: "lost" | "found";
  userId: string;
}

const ReportItemForm = ({ type, userId }: ReportItemFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    dateOccurred: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

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

        imageUrl = publicUrl;
        setUploading(false);
      }

      const { error } = await supabase.from("items").insert({
        user_id: userId,
        type,
        name: formData.name,
        description: formData.description || null,
        location: formData.location,
        date_occurred: formData.dateOccurred,
        image_url: imageUrl,
        status: "active",
      });

      if (error) throw error;

      toast.success(`${type === "lost" ? "Lost" : "Found"} item reported successfully!`);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        location: "",
        dateOccurred: "",
      });
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to report item");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-medium border-border">
      <CardHeader>
        <CardTitle>
          Report {type === "lost" ? "Lost" : "Found"} Item
        </CardTitle>
        <CardDescription>
          Fill in the details about the {type} item
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Blue Backpack, iPhone 13, Student ID"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Library, Cafeteria, Building A"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.dateOccurred}
                onChange={(e) => setFormData({ ...formData, dateOccurred: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Item Image (optional)</Label>
            <Input
              id="image"
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

          <Button type="submit" className="w-full" disabled={loading || uploading}>
            {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {uploading ? "Uploading Image..." : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportItemForm;
