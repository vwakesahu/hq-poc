const BasicPageLayout = ({ children, title }) => {
  return (
    <>
      <div className="p-8 text-2xl font-semibold">{title}</div>
      {children}
    </>
  );
};

export default BasicPageLayout;
