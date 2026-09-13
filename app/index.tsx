import { useLocalSearchParams } from 'expo-router';

import { PilloShell } from '@/components/pillo-shell';
import { TodayScreen } from '@/screens/today-screen';

const TodayRoute = () => {
  const { intakeId } = useLocalSearchParams<{ intakeId?: string | string[] }>();
  const focusedIntakeId = typeof intakeId === 'string' ? intakeId : undefined;

  return <PilloShell>{() => <TodayScreen focusedIntakeId={focusedIntakeId} />}</PilloShell>;
};

export default TodayRoute;
