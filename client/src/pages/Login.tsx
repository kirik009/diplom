import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { School } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', data.username);
       console.log(data.password);
      const user = await login(data.username, data.password);
      console.log('Login successful, user data:', user);
      
      toast({
        title: 'Успешный вход',
        description: `Добро пожаловать, ${user.firstName}!`,
      });
      
      // Redirect based on role
      const role = user.role.toLowerCase();
      console.log('Redirecting based on role:', role);
      
      switch (role) {
        case 'student':
          window.location.href = '/student';
          break;
        case 'teacher':
          window.location.href = '/teacher';
          break;
        case 'admin':
          window.location.href = '/admin';
          break;
        default:
          console.log('Unknown role:', role);
          window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast({
        title: 'Ошибка входа',
        description: 'Неверное имя пользователя или пароль',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-2">
            <School className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">AttendTrack</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Система учета посещаемости
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="username">Имя пользователя</Label>
                    <FormControl>
                      <Input
                        id="username"
                        placeholder="Введите имя пользователя"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password">Пароль</Label>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Введите пароль"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground text-center">
              Демонстрационные аккаунты:
            </p>
            <div className="mt-2 text-sm grid grid-cols-3 gap-2 text-center">
              <div className="p-2 border rounded-md">
                <div className="font-medium">Студент</div>
                <div className="text-muted-foreground">student1 / student1</div>
              </div>
              <div className="p-2 border rounded-md">
                <div className="font-medium">Преподаватель</div>
                <div className="text-muted-foreground">teacher1 / teacher1</div>
              </div>
              <div className="p-2 border rounded-md">
                <div className="font-medium">Администратор</div>
                <div className="text-muted-foreground">admin / admin</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
