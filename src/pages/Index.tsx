import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container relative mx-auto px-4 py-20">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              <span>Smart Lost & Found System</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Never Lose Track of Your Belongings
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A smart, community-driven platform to report lost items, find what's been found, 
              and reunite students with their belongings on campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="text-lg px-8"
              >
                <Search className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/admin/auth")}
                className="text-lg px-8"
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-xl shadow-soft border border-border">
            <div className="w-12 h-12 bg-lost-light rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-lost" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Report Lost Items</h3>
            <p className="text-muted-foreground">
              Quickly report lost items with descriptions, photos, and location details.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-soft border border-border">
            <div className="w-12 h-12 bg-found-light rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-found" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Browse Found Items</h3>
            <p className="text-muted-foreground">
              Search through found items and claim what belongs to you with verification.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-soft border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Verified</h3>
            <p className="text-muted-foreground">
              Admin-verified claims ensure items reach their rightful owners safely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
