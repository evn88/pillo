import { PilloShell } from '@/components/pillo-shell';
import { ScheduleScreen } from '@/screens/schedule-screen';

const ScheduleRoute = () => <PilloShell>{({ isLargeText }) => <ScheduleScreen isLargeText={isLargeText} />}</PilloShell>;

export default ScheduleRoute;
