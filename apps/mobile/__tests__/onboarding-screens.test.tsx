import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useOnboardingStore } from '../src/store/onboarding-store';
import { useConnectivityStore } from '../src/store/connectivity-store';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => {
  const ReactMock = require('react');
  return {
    useRouter: () => ({ push: mockPush, replace: mockReplace }),
    Stack: ({ children }: { children: unknown }) =>
      ReactMock.createElement(ReactMock.Fragment, null, children),
  };
});

// Mock gluestack-ui/core
jest.mock('@gluestack-ui/core/button/creator', () => {
  const ReactMock = require('react');
  const RN = require('react-native');
  function createButton({ Root }: { Root: React.ComponentType<unknown> }) {
    const Btn = Root as unknown as Record<string, unknown>;
    Btn.Text = ReactMock.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      ReactMock.createElement(RN.Text, { ...props, ref })
    );
    Btn.Group = RN.View;
    Btn.Spinner = RN.ActivityIndicator;
    Btn.Icon = RN.View;
    return Btn;
  }
  return { createButton };
});
jest.mock('@gluestack-ui/core/icon/creator', () => {
  const { View } = require('react-native');
  return { PrimitiveIcon: View, UIIcon: View };
});

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingStore.getState().reset();
  useConnectivityStore.setState({ isOnline: true, lastOnlineAt: null });
});

describe('Welcome screen (6.1)', () => {
  it('renders Broodly title and tagline', () => {
    const WelcomeScreen = require('../app/(onboarding)/index').default;
    render(<WelcomeScreen />);
    expect(screen.getByText('Broodly')).toBeTruthy();
    expect(screen.getByText(/right decision/)).toBeTruthy();
  });

  it('renders Get Started and Sign In buttons', () => {
    const WelcomeScreen = require('../app/(onboarding)/index').default;
    render(<WelcomeScreen />);
    expect(screen.getByText('Get Started')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('Get Started navigates to create-account', () => {
    const WelcomeScreen = require('../app/(onboarding)/index').default;
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByTestId('get-started-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/create-account');
  });

  it('Sign In navigates to auth sign-in', () => {
    const WelcomeScreen = require('../app/(onboarding)/index').default;
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByTestId('sign-in-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
  });
});

describe('Create Account screen (6.1)', () => {
  it('renders progress dots and title', () => {
    const CreateAccount = require('../app/(onboarding)/create-account').default;
    render(<CreateAccount />);
    expect(screen.getByText('Create your account')).toBeTruthy();
  });

  it('disables sign-in buttons when ToS unchecked', () => {
    const CreateAccount = require('../app/(onboarding)/create-account').default;
    render(<CreateAccount />);
    const googleBtn = screen.getByTestId('google-sign-in');
    expect(googleBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables sign-in buttons when ToS checked', () => {
    useOnboardingStore.getState().setTosAccepted(true);
    const CreateAccount = require('../app/(onboarding)/create-account').default;
    render(<CreateAccount />);
    const googleBtn = screen.getByTestId('google-sign-in');
    expect(googleBtn.props.accessibilityState?.disabled).toBe(false);
  });

  it('shows offline banner when offline', () => {
    useConnectivityStore.setState({ isOnline: false });
    const CreateAccount = require('../app/(onboarding)/create-account').default;
    render(<CreateAccount />);
    expect(screen.getByText(/You are offline/)).toBeTruthy();
  });
});

describe('Experience Level screen (6.2)', () => {
  it('renders three experience levels', () => {
    const Screen = require('../app/(onboarding)/experience-level').default;
    render(<Screen />);
    expect(screen.getByText('Newbie')).toBeTruthy();
    expect(screen.getByText('Amateur')).toBeTruthy();
    expect(screen.getByText('Sideliner')).toBeTruthy();
  });

  it('Continue is disabled until level selected', () => {
    const Screen = require('../app/(onboarding)/experience-level').default;
    render(<Screen />);
    const btn = screen.getByTestId('next-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('selecting a level enables Continue', () => {
    useOnboardingStore.getState().setExperienceLevel('amateur');
    const Screen = require('../app/(onboarding)/experience-level').default;
    render(<Screen />);
    const btn = screen.getByTestId('next-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });
});

describe('Region Setup screen (6.2)', () => {
  it('renders region input', () => {
    const Screen = require('../app/(onboarding)/region-setup').default;
    render(<Screen />);
    expect(screen.getByText(/Where are your bees/)).toBeTruthy();
    expect(screen.getByTestId('region-input')).toBeTruthy();
  });
});

describe('Apiary Setup screen (6.3)', () => {
  it('renders apiary name input and hive stepper', () => {
    const Screen = require('../app/(onboarding)/apiary-setup').default;
    render(<Screen />);
    expect(screen.getByText(/Set up your first apiary/)).toBeTruthy();
    expect(screen.getByTestId('apiary-name-input')).toBeTruthy();
    expect(screen.getByTestId('hive-count')).toBeTruthy();
  });

  it('starts with hive count of 1', () => {
    const Screen = require('../app/(onboarding)/apiary-setup').default;
    render(<Screen />);
    expect(screen.getByTestId('hive-count').props.children).toBe(1);
  });
});

describe('Goal Selection screen (6.3)', () => {
  it('renders goal chips', () => {
    const Screen = require('../app/(onboarding)/goal-selection').default;
    render(<Screen />);
    expect(screen.getByText(/Colony Health/)).toBeTruthy();
    expect(screen.getByText(/Honey Production/)).toBeTruthy();
    expect(screen.getByText(/Learning/)).toBeTruthy();
    expect(screen.getByText(/Growth/)).toBeTruthy();
  });

  it('renders interaction mode options', () => {
    const Screen = require('../app/(onboarding)/goal-selection').default;
    render(<Screen />);
    expect(screen.getByText('Voice First')).toBeTruthy();
    expect(screen.getByText('Tap & Read')).toBeTruthy();
  });
});

describe('Disclaimer screen (6.4)', () => {
  it('renders advisory text', () => {
    const Screen = require('../app/(onboarding)/disclaimer').default;
    render(<Screen />);
    expect(screen.getByText(/Advisory-Only Guidance/)).toBeTruthy();
    expect(screen.getByText(/decision-support recommendations/)).toBeTruthy();
  });

  it('Continue is disabled until checkbox checked', () => {
    const Screen = require('../app/(onboarding)/disclaimer').default;
    render(<Screen />);
    const btn = screen.getByTestId('next-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('checking disclaimer enables Continue', () => {
    const Screen = require('../app/(onboarding)/disclaimer').default;
    render(<Screen />);
    fireEvent.press(screen.getByTestId('disclaimer-checkbox'));
    const btn = screen.getByTestId('next-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });
});

describe('Summary screen (6.4)', () => {
  it('renders summary with store values', () => {
    useOnboardingStore.getState().setExperienceLevel('amateur');
    useOnboardingStore.getState().setRegion('Oregon');
    useOnboardingStore.getState().setApiary({
      name: 'Backyard',
      locationLat: null,
      locationLng: null,
      hiveCount: 5,
    });
    useOnboardingStore.getState().setGoals(['health', 'honey']);
    useOnboardingStore.getState().setInteractionMode('voice_first');

    const Screen = require('../app/(onboarding)/summary').default;
    render(<Screen />);
    expect(screen.getByText('Amateur')).toBeTruthy();
    expect(screen.getByText('Oregon')).toBeTruthy();
    expect(screen.getByText('Backyard')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Colony Health, Honey Production')).toBeTruthy();
    expect(screen.getByText('Voice First')).toBeTruthy();
  });

  it('renders Let\'s Go button', () => {
    const Screen = require('../app/(onboarding)/summary').default;
    render(<Screen />);
    expect(screen.getByTestId('complete-btn')).toBeTruthy();
  });
});

describe('Catchup Assessment screen (6.5)', () => {
  it('renders checklist items', () => {
    const Screen = require('../app/(onboarding)/catchup-assessment').default;
    render(<Screen />);
    expect(screen.getByText(/Queen present and laying/)).toBeTruthy();
    expect(screen.getByText(/Colony strength/)).toBeTruthy();
    expect(screen.getByText(/Treatments applied/)).toBeTruthy();
  });
});

describe('Onboarding route file structure', () => {
  const fs = require('fs');
  const path = require('path');
  const appDir = path.resolve(__dirname, '../app/(onboarding)');

  const expectedFiles = [
    '_layout.tsx',
    'index.tsx',
    'create-account.tsx',
    'experience-level.tsx',
    'region-setup.tsx',
    'apiary-setup.tsx',
    'goal-selection.tsx',
    'catchup-assessment.tsx',
    'disclaimer.tsx',
    'summary.tsx',
  ];

  it.each(expectedFiles)('(onboarding)/%s exists', (file) => {
    expect(fs.existsSync(path.join(appDir, file))).toBe(true);
  });
});
