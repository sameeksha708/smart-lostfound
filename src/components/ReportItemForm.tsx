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
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = async () => {
    if (!imageFile && !formData.description) {
      toast.error("Please provide an image or description to analyze");
      return;
    }

    setAnalyzing(true);
    setAiAnalysis(null);

    try {
      let imageUrl = null;

      // Upload image temporarily if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Call AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: {
          imageUrl,
          description: formData.description,
          name: formData.name
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAiAnalysis(data.analysis);
      setShowAnalysis(true);
      toast.success("AI analysis complete!");

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze item");
    } finally {
      setAnalyzing(false);
    }
  };

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

      // Use AI-enhanced description if available
      const finalDescription = aiAnalysis 
        ? `${formData.description}\n\n--- AI Analysis ---\n${aiAnalysis}`
        : formData.description || null;

      const { error } = await supabase.from("items").insert({
        user_id: userId,
        type,
        name: formData.name,
        description: finalDescription,
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
      setAiAnalysis(null);
      setShowAnalysis(false);
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

          {type === "lost" && (imageFile || formData.description) && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleAnalyze}
              disabled={analyzing || loading}
            >
              {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {analyzing ? "Analyzing with AI..." : "🔍 Analyze with AI"}
            </Button>
          )}

          {showAnalysis && aiAnalysis && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{aiAnalysis}</p>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={loading || uploading || analyzing}>
            {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {uploading ? "Uploading Image..." : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportItemForm;
