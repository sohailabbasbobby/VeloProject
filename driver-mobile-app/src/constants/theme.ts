import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const SLIDER_WIDTH = width - 40;
export const THUMB_SIZE = 46;
export const SWIPE_RANGE = SLIDER_WIDTH - THUMB_SIZE - 8;

export const COLOURS = {
  bg:          '#070708',
  surface:     '#111112',
  surface2:    '#161619',
  border:      '#1F1F22',
  border2:     '#2A2A2D',
  gold:        '#D4AF37',
  green:       '#34C759',
  blue:        '#007AFF',
  red:         '#FF3B30',
  textPrimary: '#FFFFFF',
  textMuted:   '#7E7F82',
  textDim:     '#4A4A4C',
  textDark:    '#3C3C3E',
};

export const sharedStyles = StyleSheet.create({
  // Slider
  sliderContainer:   { width: SLIDER_WIDTH, height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 4, position: 'relative', overflow: 'hidden' },
  sliderThumb:       { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  thumbArrow:        { color: COLOURS.bg, fontWeight: '900', fontSize: 16 },
  sliderLabelText:   { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, zIndex: 1 },

  // Info boxes used across screens
  infoContentBoxWrapper: { backgroundColor: COLOURS.bg, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  infoBoxMicroHeader:    { color: COLOURS.textDim, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  infoBoxValueText:      { color: COLOURS.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  infoBoxValueTextBold:  { color: COLOURS.gold, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  // Emergency cancel buttons
  emergencyCancelBtnText: { color: COLOURS.red, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  takeoverEmergencyCancelBtn: { backgroundColor: 'rgba(255,59,48,0.06)', height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)', justifyContent: 'center', alignItems: 'center' },
  executionEmergencyCancelBtn: { backgroundColor: 'rgba(255,59,48,0.06)', height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },

  // Admin lockout overlay
  adminLockoutOverlaySurface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,7,8,0.96)', zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockoutCardContainer:       { backgroundColor: COLOURS.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: COLOURS.red, width: '100%', alignItems: 'center' },
  lockoutPulsingText:         { color: COLOURS.red, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 },
  lockoutSubText:             { color: COLOURS.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  cancelRequestBtn:           { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLOURS.bg, borderRadius: 8, borderWidth: 0.5, borderColor: '#222' },

  // Map workspace
  workspaceCanvas:              { flex: 1, position: 'relative' },
  topFloatingStatusBar:         { position: 'absolute', top: 15, left: 15, right: 15, height: 52, backgroundColor: COLOURS.bg, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, zIndex: 10, justifyContent: 'space-between' },
  burgerButton:                 { width: 30, justifyContent: 'center' },
  hamburgerLines:               { color: COLOURS.textPrimary, fontSize: 24 },
  liveIndicatorContainer:       { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  trackingPill:                 { color: COLOURS.green, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  centeredMapViewportContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  mapRoadwayLine:               { position: 'absolute', width: '150%', height: 1, backgroundColor: '#111113' },
  arrowheadVector:              { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: COLOURS.gold, transform: [{ rotate: '35deg' }] },
});
