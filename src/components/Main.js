import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'; // Styles for the tabs

function Main() {
  return (
    <div className="main-content">
      <Tabs>
        <TabList>
          <Tab>Upload your own text</Tab>
          <Tab>Use a URL</Tab>
        </TabList>

        <TabPanel>
          <input type="file" />
        </TabPanel>
        <TabPanel>
          <input type="text" placeholder="Enter a URL" />
        </TabPanel>
      </Tabs>
    </div>
  );
}

export default Main;
