import { BookOpen, Shield } from "lucide-react";

interface NavbarProps {
  isAdmin?: boolean;
}

const Navbar = ({ isAdmin = false }: NavbarProps) => {
  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Shield className="w-6 h-6 text-primary" />
          ) : (
            <BookOpen className="w-6 h-6 text-primary" />
          )}
          <h1 className="text-xl font-bold">
            {isAdmin ? "Admin Portal" : "Smart Lost & Found"}
          </h1>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
