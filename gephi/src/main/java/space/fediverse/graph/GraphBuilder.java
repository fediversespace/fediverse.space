package space.fediverse.graph;

import org.gephi.graph.api.GraphController;
import org.gephi.graph.api.GraphModel;
import org.gephi.graph.api.Node;
import org.gephi.graph.api.UndirectedGraph;
import org.gephi.io.database.drivers.PostgreSQLDriver;
import org.gephi.io.database.drivers.SQLUtils;
import org.gephi.io.exporter.api.ExportController;
import org.gephi.io.importer.api.Container;
import org.gephi.io.importer.api.EdgeDirectionDefault;
import org.gephi.io.importer.api.ImportController;
import org.gephi.io.importer.plugin.database.EdgeListDatabaseImpl;
import org.gephi.io.importer.plugin.database.ImporterEdgeList;
import org.gephi.io.processor.plugin.DefaultProcessor;
import org.gephi.layout.plugin.AutoLayout;
import org.gephi.layout.plugin.forceAtlas2.ForceAtlas2;
import org.gephi.project.api.ProjectController;
import org.gephi.project.api.Workspace;
import org.openide.util.Lookup;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.TimeUnit;

public class GraphBuilder {

    private static final String nodeQuery = String.join(""
            , "SELECT"
            , " scraper_instance.name AS id,"
            , " scraper_instance.name AS label,"
            , " scraper_instance.user_count"
            , " FROM scraper_instance WHERE status = 'success'"
    );

    private static final String edgeQuery = String.join(""
            , "SELECT"
            , " scraper_edge.source_id AS source,"
            , " scraper_edge.target_id AS target"
            , " FROM scraper_edge"
    );


    public static void main(String[] args) {

        Path currentRelativePath = Paths.get(".");

        // Init project & workspace; required to do things w/ gephi
        ProjectController pc = Lookup.getDefault().lookup(ProjectController.class);
        pc.newProject();
        Workspace workspace = pc.getCurrentWorkspace();

        // Get controllers and models
        ImportController importController = Lookup.getDefault().lookup(ImportController.class);
        GraphModel graphModel = Lookup.getDefault().lookup(GraphController.class).getGraphModel();
        // AttributeModel?

        // Import from database
        EdgeListDatabaseImpl db = new EdgeListDatabaseImpl();
        db.setSQLDriver(new PostgreSQLDriver());
        db.setHost("localhost");
        db.setPort(5432);
        db.setDBName(args[0]);
        db.setUsername(args[1]);
        db.setPasswd(args[2]);
        db.setNodeQuery(nodeQuery);
        db.setEdgeQuery(edgeQuery);

        ImporterEdgeList edgeListImporter = new ImporterEdgeList();
        Container container = importController.importDatabase(db, edgeListImporter);
        // If a node is in the edge list, but not node list, we don't want to create it automatically
        container.getLoader().setAllowAutoNode(false);
        container.getLoader().setAllowSelfLoop(false);
        container.getLoader().setEdgeDefault(EdgeDirectionDefault.UNDIRECTED);  // This is an undirected graph

        // Add imported data to graph
        importController.process(container, new DefaultProcessor(), workspace);

        // Layout
        AutoLayout autoLayout = new AutoLayout(2, TimeUnit.MINUTES);
        autoLayout.setGraphModel(graphModel);
//        YifanHuLayout firstLayout = new YifanHuLayout(null, new StepDisplacement(1f));
        ForceAtlas2 forceAtlas2Layout = new ForceAtlas2(null);
        forceAtlas2Layout.setLinLogMode(true);
        autoLayout.addLayout(forceAtlas2Layout, 1f);
        autoLayout.execute();

        // Update coordinates in database
        // First, connect
        String dbUrl = SQLUtils.getUrl(db.getSQLDriver(), db.getHost(), db.getPort(), db.getDBName());
        Connection conn = null;
        try {
            conn = db.getSQLDriver().getConnection(dbUrl, db.getUsername(), db.getPasswd());
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.close();
                } catch (Exception e2) {
                    // Closing failed; ah well
                }
            }
            throw new RuntimeException(e);
        }
        // Update
        UndirectedGraph graph = graphModel.getUndirectedGraph();
        for (Node node: graph.getNodes()) {
            String id = node.getId().toString();
            float x = node.x();
            float y = node.y();

            try {
                PreparedStatement statement = conn.prepareStatement(
                        "UPDATE scraper_instance SET x_coord=?, y_coord=? WHERE name=?");
                statement.setFloat(1, x);
                statement.setFloat(2, y);
                statement.setString(3, id);
                statement.executeUpdate();
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        }
        // Close connection
        try {
            conn.close();
        } catch (SQLException e) {
            // Closing failed; ah well
        }


        // Also export to gexf
        ExportController exportController = Lookup.getDefault().lookup(ExportController.class);
        try {
            exportController.exportFile(new File("fediverse.gexf"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        // Gephi doesn't seem to provide a good way to close its postgres connection, so we have to force close the
        // program. This'll leave a hanging connection for some period ¯\_(ツ)_/¯
        System.exit(0);
    }
}
