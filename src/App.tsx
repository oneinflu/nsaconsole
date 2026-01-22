import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ManageCourses from "./pages/Courses/ManageCourses";
import ManageCourse from "./pages/Courses/ManageCourse";

import ProgramsPage from "./pages/Programs/Programs";
import PartsLevelsPage from "./pages/Programs/PartsLevels";
import PapersPage from "./pages/Programs/Papers";
import CoursesPage from "./pages/Programs/Courses";
import StudentsViewAll from "./pages/Students/ViewAll";
import Blogs from "./pages/Library/Blogs";
import BlogAdd from "./pages/Library/BlogAdd";
import BlogEdit from "./pages/Library/BlogEdit";
import FacultyView from "./pages/FacultyColleges/Faculty";
import CollegesView from "./pages/FacultyColleges/Colleges";
import TeamMembers from "./pages/TeamPermissions/TeamMembers";
import Roles from "./pages/TeamPermissions/Roles";
import Permissions from "./pages/TeamPermissions/Permissions";
import CategoriesPage from "./pages/Institutions/Categories";
import PackagesPage from "./pages/Offerings/Packages";
import PackageFeaturesPage from "./pages/Offerings/PackageFeatures";
import OffersPage from "./pages/Offerings/Offers";
import OfferDetailsPage from "./pages/Offerings/OfferDetails";
import BatchesPage from "./pages/Batches/Batches";
import BatchDetailsPage from "./pages/Batches/BatchDetails";
import EnrollmentsPage from "./pages/Enrollments/Enrollments";
import EnrollmentDetailsPage from "./pages/Enrollments/EnrollmentDetails";
import OrdersPaymentsPage from "./pages/Operations/OrdersPayments";
import OrderDetailsPage from "./pages/Operations/OrderDetails";
import InvoicesPage from "./pages/Operations/Invoices";
import InvoiceDetailsPage from "./pages/Operations/InvoiceDetails";
import IntegrationsPage from "./pages/Settings/Integrations";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/courses/manage-courses" element={<ManageCourses />} />
            <Route path="/courses/:courseId" element={<ManageCourse />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/parts-levels" element={<PartsLevelsPage />} />
            <Route path="/programs/papers" element={<PapersPage />} />
            <Route path="/programs/courses" element={<CoursesPage />} />
          
            <Route path="/students/view-all" element={<StudentsViewAll />} />
            <Route path="/students/manage-students" element={<StudentsViewAll />} />
            <Route path="/courses/manage-blogs" element={<Blogs />} />
            <Route path="/courses/manage-blogs/new" element={<BlogAdd />} />
            <Route path="/courses/manage-blogs/:blogId/edit" element={<BlogEdit />} />
            <Route path="/team-permissions/team-members" element={<TeamMembers />} />
            <Route path="/team-permissions/roles" element={<Roles />} />
            <Route path="/team-permissions/permissions" element={<Permissions />} />
            <Route path="/faculty-colleges/faculty" element={<FacultyView />} />
            <Route path="/faculty-colleges/colleges" element={<CollegesView />} />
            <Route path="/institutions/categories" element={<CategoriesPage />} />
            <Route path="/offerings/packages" element={<PackagesPage />} />
            <Route path="/offerings/packages/:bundleId/features" element={<PackageFeaturesPage />} />
            <Route path="/offerings/offers" element={<OffersPage />} />
            <Route path="/offerings/offers/:offerId" element={<OfferDetailsPage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/batches/:batchId" element={<BatchDetailsPage />} />
            <Route path="/enrollments" element={<EnrollmentsPage />} />
            <Route path="/enrollments/:enrollmentId" element={<EnrollmentDetailsPage />} />
            <Route path="/operations/orders" element={<OrdersPaymentsPage />} />
            <Route path="/operations/orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="/operations/invoices" element={<InvoicesPage />} />
            <Route path="/operations/invoices/:invoiceId" element={<InvoiceDetailsPage />} />
            <Route path="/settings/integrations" element={<IntegrationsPage />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
