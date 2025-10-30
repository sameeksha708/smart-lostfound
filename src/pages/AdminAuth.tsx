import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    // Check if user is already logged in and is admin
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();

        if (roles) {
          navigate("/admin/dashboard");
        }
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is admin
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roles) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      toast.success("Admin signed in successfully!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Failed to create admin account");
      }

      // Assign admin role using the security function
      const { data: assignResult, error: assignError } = await supabase.rpc(
        'assign_admin_role',
        { 
          _user_id: data.user.id, 
          _access_code: accessCode 
        }
      );

      if (assignError) throw assignError;

      if (!assignResult) {
        // If the code was wrong, delete the user account
        await supabase.auth.admin.deleteUser(data.user.id);
        throw new Error("Invalid admin access code. Please try again with the correct code.");
      }

      toast.success("Admin account created successfully! You can now sign in.");
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setAccessCode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Secure admin access only</p>
        </div>

        <Card className="shadow-medium border-border">
          <CardHeader>
            <CardTitle>{isSignUp ? "Admin Registration" : "Admin Login"}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Create a new admin account with the access code" 
                : "Enter your admin credentials"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="access-code">What is the admin-access code? *</Label>
                  <Input
                    id="access-code"
                    type="text"
                    placeholder="Enter the admin access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact your system administrator for the access code
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSignUp ? "Create Admin Account" : "Sign In as Admin"}
              </Button>

              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAccessCode("");
                  }}
                  className="text-sm"
                >
                  {isSignUp 
                    ? "Already have an admin account? Sign in" 
                    : "Need to create an admin account? Sign up"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full mt-4"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default AdminAuth;
