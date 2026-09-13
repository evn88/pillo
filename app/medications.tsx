import { PilloShell } from '@/components/pillo-shell';
import { MedicationsScreen } from '@/screens/medications-screen';

const MedicationsRoute = () => <PilloShell>{({ isLargeText }) => <MedicationsScreen isLargeText={isLargeText} />}</PilloShell>;

export default MedicationsRoute;
