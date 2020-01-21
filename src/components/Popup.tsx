import React from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import SubscriptionsIcon from '@material-ui/icons/Subscriptions';
import YoutubeSearchedForIcon from '@material-ui/icons/YoutubeSearchedFor';
import DeleteIcon from '@material-ui/icons/Delete';
import CachedIcon from '@material-ui/icons/Cached';
import GitHubIcon from '@material-ui/icons/GitHub';
import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
import Tooltip from '@material-ui/core/Tooltip';
import Box from '@material-ui/core/Box';
import VideoList from './video/VideoList';
import SearchChannelInput from './channel/SearchChannelInput';
import RootRef from '@material-ui/core/RootRef';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Channel } from '../models/Channel';
import { getChannelActivities, getVideoInfo } from '../helpers/youtube';
import { Video } from '../models/Video';
import { DeleteChannelDialog } from './channel/DeleteChannelDialog';
import { getDateBefore } from '../helpers/utils';
import VideoGrid from './video/VideoGrid';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      backgroundColor: '#f44336',
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    grow: {
      flexGrow: 1,
    },
    white: {
      color: '#fff',
    },
    title: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
      },
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    },
    container: {
      display: 'flex',
      width: '100%',
      height: '80vh',
      justifyContent: 'center',
    },
    centered: {
      alignSelf: 'center',
      textAlign: 'center',
      margin: '0 80px'
    },
  }),
);

const getListStyle = (isDraggingOver: boolean) => ({
  //background: isDraggingOver ? 'lightblue' : 'lightgrey',
});

const getListItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  // styles we need to apply on draggables
  ...draggableStyle,

  ...(isDragging && {
    background: "rgb(235,235,235)"
  })
});

// a little function to help us with reordering the dnd result
const reorder = (list: any, startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default function Popup() {
  const classes = useStyles();
  const theme = useTheme();
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [openDeleteChannelDialog, setOpenDeleteChannelDialog] = React.useState(false);
  const [selectedChannelIndex, setSelectedChannelIndex] = React.useState(-1);
  const [channelToDelete, setChannelToDelete] = React.useState<Channel>();
  const [channelToDeleteIndex, setChannelToDeleteIndex] = React.useState(0);
  let [cache, setCache] = React.useState<any>({});
  const aMonthAgoDate = getDateBefore(30);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const getChannelVideos = (channel: Channel): Promise<Video[]> => {
    return new Promise((resolve, reject) => {
      //console.log('cache', cache);
      if (cache[channel.id]?.length) {
        //console.log('in cache', cache[channel.id]);
        resolve(cache[channel.id]);
      } else {
        getChannelActivities(channel.id, aMonthAgoDate).then((results) => {
          //console.log(results);
          if (results?.items) {
            const videoIds = results.items.map((item: any) => item.contentDetails.upload?.videoId);
            //console.log(videoIds);
            getVideoInfo(videoIds).then((videos?: Video[]) => {
              //console.log(videos);
              cache[channel.id] = videos;
              setCache(cache);
              resolve(videos || []);
            }).catch((error) => {
              console.error(error);
              resolve([]);
            });
          } else {
            resolve([]);
          }
        }).catch((error) => {
          console.error(error);
          resolve([]);
        });
      }
    });
  };

  const addChannel = (channel: Channel) => {
    // Add channel
    //console.log('selected channel:', channel);
    const found: Channel | undefined = channels.find((c: Channel) => c.id === channel.id);
    if (!found) {
      setChannels([...channels, channel]);
      setSelectedChannelIndex(channels.length);
    } else {
      setSelectedChannelIndex(channels.indexOf(found));
    }
    // Get channel videos
    setIsLoading(true);
    getChannelVideos(channel).then((videos: Video[]) => {
      setVideos(videos || []);
      setIsLoading(false);
    });
  };

  const selectChannel = (channel: Channel, index: number) => {
    // Select channel
    //console.log('selected channel:', channel);
    setSelectedChannelIndex(index);
    // Get its videos
    setIsLoading(true);
    getChannelVideos(channel).then((videos: Video[]) => {
      setVideos(videos || []);
      setIsLoading(false);
      window.scrollTo(0, 0); // scroll to top
    });
  };
  
  const deleteChannel = (event: any, channel: Channel, index: number) => {
    event.stopPropagation();
    setChannelToDelete(channel);
    setChannelToDeleteIndex(index);
    setOpenDeleteChannelDialog(true);
  };

  const confirmDeleteChannel = (index: number) => {
    setChannels(channels.filter((_, i) => i !== index));
    if (selectedChannelIndex === index) {
      setVideos([]);
    }
    closeDeleteChannelDialog();
  };

  const closeDeleteChannelDialog = () => {
    setOpenDeleteChannelDialog(false);
  };

  const showAllChannels = () => {
    // Select "All"
    setSelectedChannelIndex(-1);
    // Get all channels videos
    setIsLoading(true);
    setVideos([]);
    let promises: Promise<any>[] = [];
    let videos: Video[]= [];

    channels.forEach((channel: Channel) => {

      const promise = getChannelVideos(channel).then((newVideos: Video[]) => {
        //console.log(channel.title, newVideos);
        videos.push(...newVideos);
      });
      promises.push(promise);

    });

    Promise.all(promises).finally(() => {
      setVideos(videos);
      setIsLoading(false);
    });
  };

  const refreshChannels = (event: any) => {
    event.stopPropagation();
    cache = {};
    setCache(cache);
    showAllChannels();
  };

  const onChannelDragEnd = (result: any) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items: Channel[] = reorder(
      channels,
      result.source.index,
      result.destination.index
    ) as Channel[];

    //console.log(items);
    setChannels(items);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        color="secondary"
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton, open && classes.hide)}
          >
            <MenuIcon />
          </IconButton>
          <Typography className={classes.title} variant="h6" noWrap>
            Youtube viewer
          </Typography>
          <SearchChannelInput onSelect={addChannel} />
          <div className={classes.grow} />
          <a href="https://github.com/AXeL-dev/youtube-viewer" target="_blank" rel="noopener noreferrer">
            <IconButton
              edge="end"
              aria-label="github link"
              color="inherit"
              className={classes.white}
            >
              <GitHubIcon />
            </IconButton>
          </a>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={open}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div>
        <Divider />
        <DragDropContext onDragEnd={onChannelDragEnd}>
          <Droppable droppableId="droppable">
          {(provided: any, snapshot: any) => (
            <RootRef rootRef={provided.innerRef}>
              <List dense subheader={<ListSubheader>Channels</ListSubheader>} style={getListStyle(snapshot.isDraggingOver)}>
                <ListItem button key="all" selected={selectedChannelIndex === -1} onClick={() => showAllChannels()}>
                  <ListItemIcon>
                    <Badge color="secondary" badgeContent={channels.length}>
                      <Avatar>
                        <SubscriptionsIcon />
                      </Avatar>
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="All" />
                  {channels?.length > 0 && <ListItemSecondaryAction>
                    <Tooltip title="Refresh" aria-label="add">
                      <IconButton edge="end" aria-label="refresh" size="small" onClick={(event) => refreshChannels(event)}>
                        <CachedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>}
                </ListItem>
                {channels.map((channel: Channel, index: number) => (
                  <Draggable key={channel.id} draggableId={channel.id} index={index}>
                  {(provided: any, snapshot: any) => (
                    <ListItem
                      ContainerProps={{ ref: provided.innerRef }}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getListItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )}
                      button
                      selected={index === selectedChannelIndex}
                      onClick={() => selectChannel(channel, index)}
                    >
                      <ListItemIcon><Avatar alt={channel.title} src={channel.thumbnail} /></ListItemIcon>
                      <ListItemText primary={channel.title} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" size="small" onClick={(event) => deleteChannel(event, channel, index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            </RootRef>
          )}
          </Droppable>
        </DragDropContext>
      </Drawer>
      <main
        className={clsx(classes.content, {
          [classes.contentShift]: open,
        })}
        //onClick={() => handleDrawerClose()}
      >
        <div className={classes.drawerHeader} />
        {channels?.length ? selectedChannelIndex === -1 ? (
          <VideoGrid channels={channels} videos={videos} loading={isLoading} onSelect={selectChannel} />
        ) : (
          <VideoList videos={videos} loading={isLoading} />
        ) : (
          <Box className={classes.container}>
            <Typography component="div" variant="h5" color="textSecondary" className={classes.centered} style={{ cursor: 'default' }}>
              <YoutubeSearchedForIcon style={{ fontSize: 38, verticalAlign: 'middle' }} /> Start by typing a channel name in the search box
            </Typography>
          </Box>
        )}
      </main>
      <DeleteChannelDialog
        open={openDeleteChannelDialog}
        channel={channelToDelete}
        index={channelToDeleteIndex}
        onConfirm={confirmDeleteChannel}
        onClose={closeDeleteChannelDialog}
      />
    </div>
  );
}
