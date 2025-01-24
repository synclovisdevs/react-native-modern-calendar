# React Native Modern Calendar

A modern, flexible calendar component for React Native with month and day views. This component provides a beautiful and customizable calendar interface with support for events, multi-day events, and easy switching between month and day views.

## Installation

```bash
npm install react-native-modern-calendar
# or
yarn add react-native-modern-calendar
```

## Features

- Month view with event display
- Day view with detailed event scheduling
- Support for multi-day events
- Customizable event display
- Smooth navigation between months/days
- Configurable display options

## Usage

```jsx
import Calendar, { CALENDAR_MODES } from 'react-native-modern-calendar';

const App = () => {
  const events = [
    {
      id: '1',
      title: 'Team Meeting',
      startDate: new Date(2024, 2, 12, 10, 0),
      endDate: new Date(2024, 2, 12, 11, 30),
      color: '#FF7E7E'
    },
    // ... more events
  ];

  const calendarConfig = {
    showPreviousMonthDays: true,
    showEventsOnPreviousMonthDays: true,
    maxEventsPerDay: 3,
    eventHeight: 16,
    eventSpacing: 18,
  };

  const dateRange = {
    start: new Date(2024, 0, 1),
    end: new Date(2024, 11, 31)
  };

  return (
    <Calendar 
      mode={CALENDAR_MODES.MONTH}
      selectedDate={new Date()}
      dateRange={dateRange}
      events={events}
      config={calendarConfig}
      onModeChange={(mode) => console.log('Mode changed:', mode)}
    />
  );
};
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| mode | string | No | CALENDAR_MODES.MONTH | View mode ('month' or 'day') |
| selectedDate | Date | No | new Date() | Initially selected date |
| dateRange | Object | No | - | Range of dates to display |
| events | Array | No | [] | Array of events to display |
| config | Object | No | defaultConfig | Calendar configuration |
| onModeChange | function | No | - | Callback when view mode changes |

### Event Object

```javascript
{
  id: string,
  title: string,
  startDate: Date,
  endDate: Date,
  color: string
}
```

### Calendar Config

```javascript
{
  showPreviousMonthDays: boolean,
  showEventsOnPreviousMonthDays: boolean,
  maxEventsPerDay: number,
  eventHeight: number,
  eventSpacing: number
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 