
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, School } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

// Схема валидации для регистрации нового пользователя администратором
const registerUserSchema = z.object({
  username: z.string().min(3, 'Имя пользователя должно содержать минимум 3 символа'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  middleName: z.string().optional(),
  role: z.enum(['student', 'teacher', 'admin'], {
    required_error: 'Пожалуйста, выберите роль пользователя',
  }),
  groupId: z.string().optional(),
  departmentId: z.string().optional(),
});

type RegisterUserFormData = z.infer<typeof registerUserSchema>;

export default function AdminRegisterUser() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Получаем список групп для выбора
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch groups');
      return res.json();
    }
  });
  
  // Получаем список кафедр для выбора
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    },
    retry: false,
    onError: () => {
      console.log('Failed to fetch departments, they may not be implemented yet');
    }
  });
  
  const form = useForm<RegisterUserFormData>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      middleName: '',
      role: 'student',
      groupId: undefined,
      departmentId: undefined
    },
  });
  
  // Получаем текущую выбранную роль для условного рендеринга полей
  const selectedRole = form.watch('role');
  
  const onSubmit = async (data: RegisterUserFormData) => {
    setIsLoading(true);
    try {
      // Преобразуем groupId и departmentId в числа, если они есть
      const payload = {
        ...data,
        groupId: data.groupId ? parseInt(data.groupId) : null,
        departmentId: data.departmentId ? parseInt(data.departmentId) : null
      };
      
      console.log('Регистрация пользователя:', payload);
      
      const res = await apiRequest('POST', '/api/admin/users', payload);
      const user = await res.json();
      
      toast({
        title: 'Пользователь зарегистрирован',
        description: `${user.firstName} ${user.lastName} успешно добавлен в систему.`,
      });
      
      // Очищаем форму после успешной регистрации
      form.reset();
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      toast({
        title: 'Ошибка регистрации',
        description: 'Не удалось зарегистрировать пользователя. Возможно, такое имя пользователя уже занято.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Регистрация пользователя</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Создание новой учетной записи в системе
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="username">Имя пользователя*</Label>
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
                      <Label htmlFor="password">Пароль*</Label>
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
              </div>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="role">Роль пользователя*</Label>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Выберите роль пользователя" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Студент</SelectItem>
                        <SelectItem value="teacher">Преподаватель</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="lastName">Фамилия*</Label>
                      <FormControl>
                        <Input
                          id="lastName"
                          placeholder="Введите фамилию"
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
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="firstName">Имя*</Label>
                      <FormControl>
                        <Input
                          id="firstName"
                          placeholder="Введите имя"
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
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="middleName">Отчество</Label>
                      <FormControl>
                        <Input
                          id="middleName"
                          placeholder="Введите отчество (если есть)"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {selectedRole === 'student' && (
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="group">Группа</Label>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading || groups.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger id="group">
                            <SelectValue placeholder="Выберите группу" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map((group: any) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {selectedRole === 'teacher' && (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="department">Кафедра</Label>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading || departments.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Выберите кафедру" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department: any) => (
                            <SelectItem key={department.id} value={department.id.toString()}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="reset"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isLoading}
                >
                  Отменить
                </Button>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Регистрация...' : 'Зарегистрировать пользователя'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
