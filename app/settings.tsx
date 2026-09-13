import { PilloShell } from '@/components/pillo-shell';
import { SettingsScreen } from '@/screens/settings-screen';

const SettingsRoute = () => <PilloShell>{({ isLargeText }) => <SettingsScreen isLargeText={isLargeText} />}</PilloShell>;

export default SettingsRoute;
