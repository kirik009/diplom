export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm text-gray-500 mb-2 sm:mb-0">
          &copy; {new Date().getFullYear()} AttendTrack. Все права защищены.
        </div>
        <div className="flex space-x-4">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">О системе</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Справка</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Поддержка</a>
        </div>
      </div>
    </footer>
  );
}
