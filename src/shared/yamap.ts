import YaMap from 'react-native-yamap';

let initialized = false;

export function initYaMap() {
  if (initialized || typeof YaMap?.init !== 'function') return;
  initialized = true;
  YaMap.init('423a996a-1e5a-46bc-9a66-50de18215b48');
}
