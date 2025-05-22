import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { getQueryFn } from '@/lib/queryClient';
import { formatDateTime, calculateAttendancePercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Users, School, Calendar, ClipboardList, Download, Eye, Trash, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('reports');
  const [, setLocation] = useLocation();

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/admin/classes'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/groups'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch faculties
  const { data: faculties, isLoading: facultiesLoading } = useQuery({
    queryKey: ['/api/faculties'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const isLoading = usersLoading || classesLoading || groupsLoading || subjectsLoading || facultiesLoading;

  // Form state for report generation
  const [reportForm, setReportForm] = useState({
    type: 'attendance',
    period: 'month',
    format: 'pdf'
  });

  const handleReportFormChange = (field: string, value: string) => {
    setReportForm({
      ...reportForm,
      [field]: value
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: 'Отчет сформирован',
      description: 'Отчет успешно сформирован и готов к скачиванию',
    });
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!users || !classes) {
      return {
        students: { count: 0, newCount: 0 },
        teachers: { count: 0, newCount: 0 },
        classes: { count: 0 }
      };
    }

    const students = users.filter((user: any) => user.role === 'student');
    const teachers = users.filter((user: any) => user.role === 'teacher');

    // Calculate new users in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // This is mocked since we don't have createdAt fields
    const newStudents = Math.floor(students.length * 0.1); // Assume 10% are new
    const newTeachers = Math.floor(teachers.length * 0.05); // Assume 5% are new

    // Classes held in the current month
    const currentMonth = new Date().getMonth();
    const classesThisMonth = classes.filter((cls: any) => {
      return new Date(cls.date).getMonth() === currentMonth;
    });

    return {
      students: { count: students.length, newCount: newStudents },
      teachers: { count: teachers.length, newCount: newTeachers },
      classes: { count: classesThisMonth.length }
    };
  };

  const summaryStats = getSummaryStats();

  // Get faculty attendance stats
  const getFacultyStats = () => {
    if (!faculties) return [];

    // Mock data for faculty stats
    return [
      { id: 1, name: 'Физико-математический', percentage: 87 },
      { id: 2, name: 'Информационных технологий', percentage: 83 },
      { id: 3, name: 'Экономический', percentage: 75 },
      { id: 4, name: 'Юридический', percentage: 72 },
      { id: 5, name: 'Филологический', percentage: 65 }
    ];
  };

  const facultyStats = getFacultyStats();

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-medium text-gray-800 mb-4">Панель администратора</h2>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <Users className="text-primary text-3xl mr-3 h-8 w-8" />
              <h3 className="text-xl font-medium text-gray-800">Студенты</h3>
            </div>
            <div className="text-3xl font-medium mb-1">{summaryStats.students.count}</div>
            <div className="text-sm text-gray-500">{summaryStats.students.newCount} новых за последний месяц</div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <School className="text-secondary text-3xl mr-3 h-8 w-8" />
              <h3 className="text-xl font-medium text-gray-800">Преподаватели</h3>
            </div>
            <div className="text-3xl font-medium mb-1">{summaryStats.teachers.count}</div>
            <div className="text-sm text-gray-500">{summaryStats.teachers.newCount} новых за последний месяц</div>
          </CardContent>
        </Card>
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <Calendar className="text-accent text-3xl mr-3 h-8 w-8" />
              <h3 className="text-xl font-medium text-gray-800">Занятия</h3>
            </div>
            <div className="text-3xl font-medium mb-1">{summaryStats.classes.count}</div>
            <div className="text-sm text-gray-500">Проведено за текущий месяц</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Card className="mb-8">
        <Tabs defaultValue="reports" onValueChange={setActiveTab}>
          <div className="border-b border-gray-200">
            <TabsList className="flex h-auto rounded-none border-b border-0 bg-transparent">
              <TabsTrigger 
                value="reports" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Отчеты
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Пользователи
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Группы
              </TabsTrigger>
              <TabsTrigger 
                value="subjects" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Предметы
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Настройки
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6">
            <TabsContent value="reports" className="m-0">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Создать отчет</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                      Тип отчета
                    </Label>
                    <Select
                      value={reportForm.type}
                      onValueChange={(value) => handleReportFormChange('type', value)}
                    >
                      <SelectTrigger id="reportType" className="w-full">
                        <SelectValue placeholder="Выберите тип отчета" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Посещаемость</SelectItem>
                        <SelectItem value="stats">Статистика по преподавателям</SelectItem>
                        <SelectItem value="groups">Статистика по группам</SelectItem>
                        <SelectItem value="subjects">Статистика по предметам</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reportPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                      Период
                    </Label>
                    <Select
                      value={reportForm.period}
                      onValueChange={(value) => handleReportFormChange('period', value)}
                    >
                      <SelectTrigger id="reportPeriod" className="w-full">
                        <SelectValue placeholder="Выберите период" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Неделя</SelectItem>
                        <SelectItem value="month">Месяц</SelectItem>
                        <SelectItem value="semester">Семестр</SelectItem>
                        <SelectItem value="year">Год</SelectItem>
                        <SelectItem value="custom">Произвольный период</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reportFormat" className="block text-sm font-medium text-gray-700 mb-1">
                      Формат
                    </Label>
                    <Select
                      value={reportForm.format}
                      onValueChange={(value) => handleReportFormChange('format', value)}
                    >
                      <SelectTrigger id="reportFormat" className="w-full">
                        <SelectValue placeholder="Выберите формат" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Button className="w-full" onClick={handleGenerateReport}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Сформировать отчет
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Недавние отчеты</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Период</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создан</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Формат</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Sample data */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Посещаемость за август 2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Посещаемость</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Месяц</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">20.08.2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">PDF</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="text-primary hover:text-primary-dark">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Статистика по преподавателям</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Статистика</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Семестр</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">15.08.2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Excel</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="text-primary hover:text-primary-dark">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Статистика по группам 101-105</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Группы</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Год</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">10.08.2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">CSV</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="text-primary hover:text-primary-dark">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <Users className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление пользователями</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете добавлять, редактировать и удалять пользователей системы</p>
                <Button className="mt-2" onClick={() => setLocation('/admin/users')}>Управление пользователями</Button>ers')}>
                  Управление пользователями
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <Users className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление группами</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете создавать и редактировать группы студентов</p>
                <Button className="mt-2">
                  Управление группами
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <FileText className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление предметами</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете добавлять и редактировать учебные предметы</p>
                <Button className="mt-2">
                  Управление предметами
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-20"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Настройки системы</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете настроить параметры системы учета посещаемости</p>
                <Button className="mt-2">
                  Настройки системы
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Overall Statistics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Общая статистика посещаемости</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                {/* This would be a chart in a real application */}
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="text-gray-400 text-5xl mb-2 mx-auto h-16 w-16" />
                    <p className="text-gray-500">График общей посещаемости по факультетам</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Рейтинг факультетов</h4>
                <div className="space-y-3">
                  {facultyStats.map(faculty => (
                    <div key={faculty.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div>{faculty.name}</div>
                        <div>{faculty.percentage}%</div>
                      </div>
                      <Progress 
                        value={faculty.percentage} 
                        className={`h-2 ${
                          faculty.percentage >= 80 ? 'bg-success' : 
                          faculty.percentage >= 60 ? 'bg-primary' : 'bg-warning'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <Button className="w-full">
                  Экспортировать полный отчет
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}