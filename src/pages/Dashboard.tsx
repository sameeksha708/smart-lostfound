import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, PlusCircle, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import ReportItemForm from "@/components/ReportItemForm";
import BrowseItems from "@/components/BrowseItems";
import MyClaims from "@/components/MyClaims";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Manage your items and claims.
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Items</span>
              <span className="sm:hidden">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="report-lost" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Lost</span>
              <span className="sm:hidden">Lost</span>
            </TabsTrigger>
            <TabsTrigger value="report-found" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Found</span>
              <span className="sm:hidden">Found</span>
            </TabsTrigger>
            <TabsTrigger value="my-claims" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Claims</span>
              <span className="sm:hidden">Claims</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <BrowseItems userId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="report-lost">
            <ReportItemForm type="lost" userId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="report-found">
            <ReportItemForm type="found" userId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="my-claims">
            <MyClaims userId={user?.id || ""} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
