import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, calculateAttendancePercentage } from "@/lib/utils";
import { Camera, BarChart, Award } from "lucide-react";
import QRScannerModal from "@/components/QRScannerModal";
import GamificationCard from "@/components/GamificationCard";
import { User } from "@/contexts/AuthContext";
import { getQueryFn } from "@/lib/queryClient";
import { AttendanceRecord, Class, Subject } from "@shared/schema";
import { Link } from "wouter";


export default function StudentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Fetch attendance records
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<
    AttendanceRecord[]
  >({
    queryKey: ["/api/student/attendance"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/student/classes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery<User[]>({
    queryKey: ["/api/student/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const isLoading =
    attendanceLoading || classesLoading || subjectsLoading || teachersLoading;

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        overall: 0,
        monthly: 0,
        weekly: 0,
      };
    }

    const totalClasses = classes?.filter(
      (cls: Class) => cls.groupId === user?.groupId
    ).length;
    const presentAttendance = attendanceRecords.filter(
      (record: AttendanceRecord) => record.status === "present"
    ).length;

    // For monthly stats
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyRecords = attendanceRecords.filter(
      (record: AttendanceRecord) => new Date(record.timestamp) >= oneMonthAgo
    );

    const monthlyTotal = classes?.filter(
      (record: Class) => new Date(record.date) >= oneMonthAgo
    ).length;
    const monthlyPresent = monthlyRecords.filter(
      (record: AttendanceRecord) => record.status === "present"
    ).length;

    // For weekly stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyRecords = attendanceRecords.filter(
      (record: AttendanceRecord) => new Date(record.timestamp) >= oneWeekAgo
    );

    const weeklyTotal = classes?.filter(
      (record: Class) => new Date(record.date) >= oneMonthAgo
    ).length;
    const weeklyPresent = weeklyRecords.filter(
      (record: AttendanceRecord) => record.status === "present"
    ).length;

    return {
      overall: calculateAttendancePercentage(
        presentAttendance,
        totalClasses || 1
      ),
      monthly: calculateAttendancePercentage(monthlyPresent, monthlyTotal || 1),
      weekly: calculateAttendancePercentage(weeklyPresent, weeklyTotal || 1),
    };
  };

  // Get recent attendance records
  const getRecentAttendance = () => {
    if (!attendanceRecords || !classes || !subjects || !teachers) return [];

    const teachersMap = teachers.reduce(
      (acc: Record<number, User>, teacher: User) => {
        if (teacher.role === "teacher") {
          acc[teacher.id] = teacher;
        }
        return acc;
      },
      {}
    );

    const subjectsMap = subjects.reduce(
      (acc: Record<number, Subject>, subject: Subject) => {
        acc[subject.id] = subject;
        return acc;
      },
      {}
    );

    const classesMap = classes.reduce(
      (acc: Record<number, Class>, cls: Class) => {
        acc[cls.id] = cls;
        return acc;
      },
      {}
    );

    return attendanceRecords
      .sort((a: AttendanceRecord, b: AttendanceRecord) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      })
      .slice(0, 5)
      .map((record: AttendanceRecord) => {
        const classInfo = classesMap[record.classId];
        const subject = classInfo ? subjectsMap[classInfo.subjectId] : null;
        const teacher = classInfo ? teachersMap[classInfo.teacherId] : null;

        return {
          id: record.id,
          date: formatDateTime(record.timestamp),
          subject: subject ? subject.name : "Неизвестный предмет",
          teacher: teacher
            ? `${teacher.lastName} ${teacher.firstName.charAt(0)}.${
                teacher.middleName ? teacher.middleName.charAt(0) + "." : ""
              }`
            : "Неизвестный преподаватель",
          status: record.status,
        };
      });
  };

  // Get today's schedule

  const attendanceStats = calculateStats();
  const recentAttendance = getRecentAttendance();

  const handleQRScanSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/student/attendance"] });
  };

  // Skip demo buttons for production
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-medium text-gray-800 mb-4">
        Панель студента
      </h2>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Scan QR Code Card */}
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Camera className="text-primary text-3xl mr-3 h-8 w-8" />
              <h3 className="text-xl font-medium text-gray-800">
                Отметить посещение
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Отсканируйте QR-код преподавателя для отметки о посещении занятия
            </p>
            <Button className="w-full" onClick={() => setIsQRScannerOpen(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Сканировать QR-код
            </Button>
          </CardContent>
        </Card>

        {/* My Attendance Stats Card */}
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <BarChart className="text-accent text-3xl mr-3 h-8 w-8" />
              <h3 className="text-xl font-medium text-gray-800">
                Моя посещаемость
              </h3>
            </div>
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <div className="text-2xl font-medium text-success">
                  {attendanceStats.overall}%
                </div>
                <div className="text-sm text-gray-500">Общая</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-medium text-warning">
                  {attendanceStats.monthly}%
                </div>
                <div className="text-sm text-gray-500">Этот месяц</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-medium text-error">
                  {attendanceStats.weekly}%
                </div>
                <div className="text-sm text-gray-500">Эта неделя</div>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <BarChart className="mr-2 h-4 w-4" />
              Подробная статистика
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">
            Недавние Занятия
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Дата
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Предмет
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Преподаватель
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Загрузка...
                    </td>
                  </tr>
                ) : recentAttendance.length > 0 ? (
                  recentAttendance.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.teacher}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`status-${item.status}`}
                        >
                          {item.status === "present"
                            ? "Присутствовал"
                            : item.status === "late"
                            ? "Опоздание"
                            : "Отсутствовал"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Нет данных о посещениях
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="link" className="text-primary">
              <Link href="student/records">Все занятия</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => {
          setIsQRScannerOpen(false);
        }}
        onSuccess={handleQRScanSuccess}
      />
    </div>
  );
}
