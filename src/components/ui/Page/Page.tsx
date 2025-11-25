import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Layout/Sidebar';

interface IProps {
  containerClassName?: string;
  pageClassName?: string;
}

const Page: React.FC<React.PropsWithChildren<IProps>> = ({
  containerClassName,
  children,
  pageClassName,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-screen bg-background text-foreground transition-colors duration-300',
        pageClassName
      )}
    >
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header />
        <div
          className={cn(
            'flex flex-1 flex-col items-center px-2 md:px-6 pt-4 pb-16 overflow-x-hidden',
            containerClassName
          )}
        >
          <div className="w-full max-w-[1600px]">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Page;
