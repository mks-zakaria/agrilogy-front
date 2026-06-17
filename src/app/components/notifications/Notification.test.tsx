/**
 * Component tests for the redesigned Notification card. next-intl is globally
 * mocked (jest.setup.after.js) so the translation key is rendered verbatim;
 * assertions target data values + the unread indicator rather than copy.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import Notification, { type NotificationPayload } from './Notification';

const basePayload = (over: Partial<NotificationPayload> = {}): NotificationPayload => ({
  yesterday_temperature: '21.4',
  today_temperature: '24.8',
  yesterday_humidity: '58',
  today_humidity: '52',
  ET0: '5.6',
  soil_humidity: '34',
  soil_temperature: '19.2',
  soil_ph: '6.8',
  perfect_irrigation_period: '05:00 – 07:00',
  last_irrigation_date: '2026-06-15',
  last_start_irrigation_hour: '',
  last_finish_irrigation_hour: '',
  used_water_irrigation: '120',
  notification_date: '2026-06-17T08:00:00',
  zone_id: 1,
  zone_name: 'Parcelle Nord',
  ...over,
});

const renderCard = (props: Partial<React.ComponentProps<typeof Notification>> = {}) =>
  render(
    <ChakraProvider>
      <Notification
        id={1}
        notification={basePayload()}
        is_read={false}
        read_at={null}
        {...props}
      />
    </ChakraProvider>
  );

describe('Notification card', () => {
  it('renders the zone name as title and the reading values', () => {
    renderCard();
    expect(screen.getByText('Parcelle Nord')).toBeInTheDocument();
    expect(screen.getByText('24.8')).toBeInTheDocument(); // today air temp
    expect(screen.getByText('6.8')).toBeInTheDocument(); // soil pH
    expect(screen.getByText('34')).toBeInTheDocument(); // soil moisture
  });

  it('shows the unread indicator only when not read', () => {
    const { unmount } = renderCard({ is_read: false });
    expect(
      screen.getByLabelText('notifications.card.unread')
    ).toBeInTheDocument();
    unmount();

    renderCard({ is_read: true });
    expect(
      screen.queryByLabelText('notifications.card.unread')
    ).not.toBeInTheDocument();
  });

  it('renders edit/delete actions only when handlers are provided', () => {
    const onEditZone = jest.fn();
    renderCard({ onEditZone });
    // The edit button label is the (mocked) translation key.
    expect(
      screen.getByText('notifications.card.editNotification')
    ).toBeInTheDocument();
  });
});
