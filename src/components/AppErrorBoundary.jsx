import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('UI error boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <p className="text-sm font-semibold">Cài đặt gặp lỗi hiển thị.</p>
          <p className="mt-2 text-sm">Vui lòng tải lại trang (Ctrl + Shift + R). Nếu vẫn lỗi, hãy đăng xuất và đăng nhập lại.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
