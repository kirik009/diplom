import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Login from "@/pages/Login";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/contexts/AuthContext";
// Динамический импорт страницы регистрации
const Register = React.lazy(() => import("@/pages/Register"));

function ProtectedRoute({ 
  component: Component, 
  allowedRoles = [] 
}: { 
  component: React.ComponentType; 
  allowedRoles?: string[] 
}) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    window.location.href = '/';
    return null;
  }
  
  return <Component />;
}

function Router() {
  const { user } = useAuth();
  
  const getDashboardRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'student':
        return '/student';
      case 'teacher':
        return '/teacher';
      case 'admin':
        return '/admin';
      default:
        return '/login';
    }
  };
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/student" component={() => <ProtectedRoute component={StudentDashboard} allowedRoles={['student']} />} />
      <Route path="/teacher" component={() => <ProtectedRoute component={TeacherDashboard} allowedRoles={['teacher', 'admin']} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />} />
      <Route path="/">
        {() => {
          window.location.href = getDashboardRoute();
          return null;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  
  return (
    <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-6">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
