import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f56ae',
      dark: '#082077',
      light: '#5f8fd6',
    },
    secondary: {
      main: '#fc161d',
      dark: '#bd1217',
      light: '#ff6f75',
    },
    background: {
      default: '#eef3fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2f4c',
      secondary: '#4e5f78',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Nunito Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    h3: {
      fontFamily: '"Bree Serif", Georgia, serif',
      fontWeight: 400,
    },
    h4: {
      fontFamily: '"Bree Serif", Georgia, serif',
      fontWeight: 400,
    },
    h5: {
      fontFamily: '"Bree Serif", Georgia, serif',
      fontWeight: 400,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(120deg, rgba(8, 32, 119, 0.96), rgba(15, 86, 174, 0.96))',
        },
      },
    },
  },
});

export default theme;
