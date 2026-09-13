import { useLocalSearchParams } from 'expo-router';

import { PilloApplication } from '../App';

const TodayRoute = () => {
  const { intakeId } = useLocalSearchParams<{ intakeId?: string | string[] }>();
  const focusedIntakeId = typeof intakeId === 'string' ? intakeId : undefined;

  return <PilloApplication activeTab="today" focusedIntakeId={focusedIntakeId} />;
};

export default TodayRoute;
