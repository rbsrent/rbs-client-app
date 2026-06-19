import { Dimensions, StyleSheet } from 'react-native';

const W = Dimensions.get('window').width;
export const CARD_WIDTH = (W - 32 - 12) / 2;

export const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    lineHeight: 20,
  },
  sub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  imageContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#D8D8D8',
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  empty: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});