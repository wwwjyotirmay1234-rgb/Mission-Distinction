---
name: Mobile sidebar pattern
description: How the responsive sidebar works across admin and student layouts
---
SidebarContext (contexts/SidebarContext.tsx) provides {open, setOpen}. AdminLayout/StudentLayout wrap children in SidebarProvider. Desktop: aside with "hidden md:flex". Mobile: Sheet from shadcn/ui triggered by hamburger in Header (visible md:hidden). Sidebar nav items call onNavigate() prop on click to close Sheet on mobile.

**Why:** Fixed ml-64 with no hamburger meant mobile users saw broken layouts and couldn't access navigation.

**How to apply:** Any new portal/layout must follow this pattern. Header always gets useSidebar().setOpen for the hamburger button.
