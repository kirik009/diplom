
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { Users, Plus, Edit, Trash, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Department, Group, User } from '@shared/schema';

export default function AdminUsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Получаем список всех пользователей
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Получаем список групп для фильтрации
  const { data: groups, isLoading: groupsLoading, error : groupsError} = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });
   const { data: departments, isLoading: departmentsLoading, error : departmentsError} = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Фильтрация пользователей
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Удаление пользователя
  const handleDeleteUser = async (userId: number) => {
    try {
      await apiRequest('DELETE', `/api/admin/users/${userId}`, {});
      toast({
        title: 'Пользователь удален',
        description: 'Пользователь был успешно удален из системы.',
      });
      
      // Обновляем список пользователей
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пользователя.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Получение названия группы по ID
  const getGroupName = (groupId: number | null) => {
    if (!groupId) return '—';
    const group = groups?.find((g: any) => g.id === groupId);
    console.log(group)
    return group ? group.name : '—';
  };

   const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return '—';
    const group = departments?.find((g: any) => g.id === departmentId);
    console.log(group)
    return group ? group.name : '—';
  };

  // Преобразование роли в читаемый формат
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Администратор</Badge>;
      case 'teacher':
        return <Badge className="bg-blue-500">Преподаватель</Badge>;
      case 'student':
        return <Badge className="bg-green-500">Студент</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setLocation('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Управление пользователями</h2>
        </div>
        <Button onClick={() => setLocation('/admin/register-user')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <Input
                placeholder="Поиск пользователей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администраторы</SelectItem>
                  <SelectItem value="teacher">Преподаватели</SelectItem>
                  <SelectItem value="student">Студенты</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <p>Загрузка пользователей...</p>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Users className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Пользователи не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя пользователя</TableHead>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Группа/Кафедра</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        {user.lastName} {user.firstName} {user.middleName || ''}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
               
                      <TableCell>
                        {user.role === 'student' ? getGroupName(user.groupId) : user.role === 'teacher' ? getDepartmentName(user.departmentId) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" 
                                  onClick={() => setLocation(`/admin/edit-user/${user.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setUserToDelete(user.id);
                                    setIsConfirmDialogOpen(true);
                                  }}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог подтверждения удаления */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => userToDelete && handleDeleteUser(userToDelete)}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
