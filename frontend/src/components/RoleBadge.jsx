const RoleBadge = ({ role }) => {
  const getBadgeClasses = () => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge badge-admin';
      case 'user':
        return 'badge badge-user';
      default:
        return 'badge badge-secondary';
    }
  };

  const formatRole = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <span className={getBadgeClasses()}>
      {formatRole(role)}
    </span>
  );
};

export default RoleBadge;
